import EventEmitter from '../util/EventEmitter'
import isPlainObject from '../util/isPlainObject'
import { transformSelection } from './operationHelpers'
import Selection from './Selection'
import DocumentChange from './DocumentChange'
import SimpleChangeHistory from './SimpleChangeHistory'

/**
 * An EditorSession provides access to the state of an editor
 * for a single document, and provides means to manipulate the underlying document.
 *
 * The EditorSession may be part of a complex application bound to a scope
 * containing only state variables for a single editor.
 */
export default class AbstractEditorSession extends EventEmitter {
  constructor (id, document, history) {
    super()

    this._id = id
    this._document = document
    this._history = history || new SimpleChangeHistory(this)

    this._tx = document.createEditingInterface()
    this._txOps = []

    this._initialize()
  }

  _initialize () {
    // initialze hooks etc
  }

  dispose () {
    // dispose hooks etc
  }

  canUndo () {
    return this._history.canUndo()
  }

  canRedo () {
    return this._history.canRedo()
  }

  getDocument () {
    return this._document
  }

  getFocusedSurface () {
    // implement this using a SurfaceManager
    // TODO: as the SurfaceManager is a vital part of the system
    // it should be part of the core implementation
  }

  getSurface (surfaceId) {
    // implement this using a SurfaceManager
  }

  getSelection () {
    return this._getSelection()
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
    this._setSelection(this._normalizeSelection(sel))
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
      if (ops.length > 0) {
        let selAfter = tx.selection
        change = new DocumentChange(ops, {
          selection: selBefore
        }, {
          selection: selAfter
        })
        change.info = info
        this._setSelection(this._normalizeSelection(selAfter))
      }
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
    return change
  }

  _commit (change, info = {}) {
    let after = change.after
    let selAfter = after.selection
    this._setSelection(this._normalizeSelection(selAfter))
    this._document._notifyChangeListeners(change, info)
    this.emit('change', change, info)
    this._history.commit(change)
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
  }

  undo () {
    let change = this._history.undo()
    // TODO: why is this necessary?
    if (change) this._setSelection(this._normalizeSelection(change.after.selection))
  }

  redo () {
    let change = this._history.redo()
    // TODO: why is this necessary?
    if (change) this._setSelection(this._normalizeSelection(change.after.selection))
  }

  /*
    There are cases when we want to explicitly reset the change history of
    an editor session
  */
  resetHistory () {
    this._history.reset()
  }

  _applyChange (change, info = {}) {
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
    // get the current selection
  }

  _setSelection (sel) {
    // store the selection somewhere
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
