import EventEmitter from '../util/EventEmitter'
import isPlainObject from '../util/isPlainObject'
import { transformSelection } from '../model/operationHelpers'
import Selection from '../model/Selection'
import DocumentChange from '../model/DocumentChange'
import EditorState from './EditorState'
import SimpleChangeHistory from './SimpleChangeHistory'

/**
 * An EditorSession provides access to the state of an editor
 * for a single document, and provides means to manipulate the underlying document.
 *
 * The EditorSession may be part of a complex application bound to a scope
 * containing only state variables for a single editor.
 */
export default class AbstractEditorSession extends EventEmitter {
  constructor (id, document, initialEditorState = {}) {
    super()

    this._id = id
    this._document = document
    this._history = this._createChangeHistory()

    this._tx = document.createEditingInterface()
    this._txOps = []

    let editorState = new EditorState(this._createEditorState(document, initialEditorState))
    this.editorState = editorState
  }

  _createChangeHistory () {
    return new SimpleChangeHistory(this)
  }

  _createEditorState (document, initialState = {}) {
    return Object.assign({
      document,
      history: this._history,
      selection: Selection.nullSelection,
      selectionState: {},
      hasUnsavedChanges: false,
      isBlurred: false
    }, initialState)
  }

  // use this for setting up hooks
  initialize () {
    // EXPERIMENTAL: hook that records changes triggered via node state updates
    this.editorState.document.on('document:changed', this._onDocumentChange, this)
  }

  dispose () {
    let editorState = this.editorState
    editorState.document.off(this)
    editorState.off(this)
    editorState.dispose()
  }

  canUndo () {
    return this._history.canUndo()
  }

  canRedo () {
    return this._history.canRedo()
  }

  getChanges () {
    return this._history.getChanges()
  }

  getDocument () {
    return this._document
  }

  getEditorState () {
    return this.editorState
  }

  getFocusedSurface () {
    // implement this using a SurfaceManager
    // TODO: as the SurfaceManager is a vital part of the system
    // it should be part of the core implementation
  }

  getSelection () {
    return this._getSelection()
  }

  getSelectionState () {
    return this.editorState.selectionState
  }

  getSurface (surfaceId) {
    // implement this using a SurfaceManager
  }

  hasUnsavedChanges () {
    return Boolean(this.editorState.hasUnsavedChanges)
  }

  isBlurred () {
    return Boolean(this.editorState.isBlurred)
  }

  setSelection (sel) {
    // console.log('EditorSession.setSelection()', sel)
    if (!sel) sel = Selection.nullSelection
    if (sel && isPlainObject(sel)) {
      sel = this.getDocument().createSelection(sel)
    }
    if (sel && !sel.isNull()) {
      if (!sel.surfaceId) {
        let fs = this.getFocusedSurface()
        if (fs) {
          sel.surfaceId = fs.id
        }
      }
    }
    // augmenting the selection with surfaceId and containerPath
    // for sake of convenience
    // TODO: rethink if this is really a good idea
    // this could also be implemented by the sub-class, with more knowledge
    // about specific data model and app structure
    if (!sel.isCustomSelection()) {
      if (!sel.surfaceId) {
        _addSurfaceId(sel, this)
      }
      if (!sel.containerPath) {
        _addContainerPath(sel, this)
      }
    }
    const editorState = this.editorState
    if (editorState.isBlurred) {
      editorState.isBlurred = false
    }
    this._setSelection(this._normalizeSelection(sel))
    editorState.propagateUpdates()

    return sel
  }

  transaction (transformation, info = {}) {
    let doc = this._document
    let selBefore = this._getSelection()
    let tx = this._tx
    let ops = doc._ops
    ops.length = 0
    tx.selection = selBefore
    let transformationCaptured = false
    try {
      transformation(tx)
      transformationCaptured = true
    } finally {
      if (!transformationCaptured) {
        this._revert(ops)
      }
    }
    let change = null
    if (transformationCaptured) {
      let selAfter = tx.selection
      if (ops.length > 0) {
        change = new DocumentChange(ops, {
          selection: selBefore
        }, {
          selection: selAfter
        })
        change.info = info
      }
      this._setSelection(this._normalizeSelection(selAfter))
    }
    if (change) {
      let changeApplied = false
      try {
        this._commit(change, info)
        changeApplied = true
      } finally {
        if (!changeApplied) {
          change = null
          this._revert(ops)
          this._setSelection(selBefore)
          // TODO: we should use this to reset the UI if something went horribly wrong
          this.emit('rescue')
        }
      }
    }
    ops.length = 0

    this.editorState.propagateUpdates()

    return change
  }

  _commit (change, info = {}) {
    let after = change.after
    let selAfter = after.selection
    this._setSelection(this._normalizeSelection(selAfter))
    this._document._notifyChangeListeners(change, info)
    this.emit('change', change, info)
    this._history.addChange(change)
  }

  // EXPERIMENTAL: for certain cases it is useful to store volatile information on nodes
  // Then the data does not need to be disposed when a node is deleted.
  updateNodeStates (tuples, options = {}) {
    // using a pseudo change to get into the existing updating mechanism
    const doc = this._document
    let change = new DocumentChange([], {}, {})
    let info = { action: 'node-state-update' }
    change._extractInformation()
    change.info = info
    for (let [id, state] of tuples) {
      let node = doc.get(id)
      if (!node) continue
      if (!node.state) node.state = {}
      Object.assign(node.state, state)
      change.updated[id] = true
    }
    if (!options.silent) {
      doc._notifyChangeListeners(change, info)
      this.emit('change', change, info)
    }
    if (options.propagate) {
      this.editorState.propagateUpdates()
    }
  }

  undo () {
    let change = this._history.undo()
    if (change) {
      this._setSelection(this._normalizeSelection(change.after.selection))
      this.editorState.propagateUpdates()
    }
  }

  redo () {
    let change = this._history.redo()
    if (change) {
      this._setSelection(this._normalizeSelection(change.after.selection))
      this.editorState.propagateUpdates()
    }
  }

  /*
    There are cases when we want to explicitly reset the change history of
    an editor session
  */
  resetHistory () {
    this._history.reset()
  }

  applyChange (change, info = {}) {
    if (!change) throw new Error('Invalid change')
    const doc = this.getDocument()
    doc._apply(change)
    if (!info.replay) {
      this._history.addChange(change)
    }
    // TODO: why is this necessary?
    doc._notifyChangeListeners(change, info)
    this.emit('change', change, info)
    if (info.replay) {
      this._setSelection(this._normalizeSelection(change.after.selection))
    }
  }

  _normalizeSelection (sel) {
    const doc = this.getDocument()
    if (!sel) {
      sel = Selection.nullSelection
    } else {
      sel.attach(doc)
    }
    return sel
  }

  _getSelection () {
    return this.editorState.selection
  }

  _setSelection (sel) {
    this.editorState.selection = sel
  }

  _onDocumentChange (change, info) {
    // console.log('_AbstractEditorSession._onDocumentChange', change, info)
    const editorState = this.editorState
    // ATTENTION: ATM we are using a DocumentChange to implement node states
    // Now it happens, that something that reacts on document changes (particularly a CitationManager)
    // updates the node state during a flow.
    // HACK: In that case we 'merge' the state update into the already propagated document change
    if (editorState.isDirty('document') && info.action === 'node-state-update') {
      let propagatedChange = editorState.getUpdate('document').change
      Object.assign(propagatedChange.updated, change.updated)
    } else {
      this.editorState._setUpdate('document', { change, info })
      this.editorState.hasUnsavedChanges = true
    }
  }

  _onTxOperation (op) {
    this._txOps.push(op)
  }

  _revert () {
    let doc = this._document
    for (let idx = this._txOps.length - 1; idx--; idx > 0) {
      let op = this._txOps[idx]
      let inverted = op.invert()
      doc._applyOp(inverted)
    }
  }

  _transformSelection (change) {
    var oldSelection = this.getSelection()
    var newSelection = transformSelection(oldSelection, change)
    return newSelection
  }
}

function _addSurfaceId (sel, editorSession) {
  if (sel && !sel.isNull() && !sel.surfaceId) {
    // TODO: We could check if the selection is valid within the given surface
    let surface = editorSession.getFocusedSurface()
    if (surface) {
      sel.surfaceId = surface.id
    }
  }
}

function _addContainerPath (sel, editorSession) {
  if (sel && !sel.isNull() && sel.surfaceId && !sel.containerPath) {
    let surface = editorSession.getSurface(sel.surfaceId)
    if (surface) {
      let containerPath = surface.getContainerPath()
      if (containerPath) {
        // console.log('Adding containerPath', containerPath)
        sel.containerPath = containerPath
      }
    }
  }
}
