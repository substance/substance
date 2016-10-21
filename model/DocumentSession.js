import extend from 'lodash/extend'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import DefaultChangeCompressor from '../model/DefaultChangeCompressor'
import DocumentChange from '../model/DocumentChange'
import MarkersManager from '../model/MarkersManager'
import Selection from '../model/Selection'
import SelectionState from '../model/SelectionState'
import SurfaceManager from '../packages/surface/SurfaceManager'
import TransactionDocument from '../model/TransactionDocument'
import CommandManager from '../ui/CommandManager'
import DragManager from '../ui/DragManager'
import GlobalEventHandler from '../ui/GlobalEventHandler'
import MacroManager from '../ui/MacroManager'
import EventEmitter from '../util/EventEmitter'

class DocumentSession extends EventEmitter {

  constructor(doc, options) {
    super()

    options = options || {}

    // whenever the session is updated these events aka stages get called
    // in this very order
    this.stages = options.stages || ['model', 'pre-render', 'render', 'post-render', 'final']
    if (!this.stages || !isArray(this.stages)) {
      throw new Error("stages is required.")
    }

    this.doc = doc
    // the stage is essentially a clone of the document
    // used to apply a sequence of document operations
    // without touching this document
    this.stage = new TransactionDocument(this.doc, this)
    this.isTransacting = false

    this.doneChanges = []
    this.undoneChanges = []
    this._lastChange = null
    // TODO: compressor needs to be worked over
    this.compressor = options.compressor || new DefaultChangeCompressor()
    // TODO: do we really want this?
    this.saveHandler = options.saveHandler

    // this is used as a key-value store during the flow to accumulate the session state
    this._data = {}
    // this contains which of the state properties have been updated since the last flow
    this._isDirty = {}
    // TODO: should be consolidated as we now have a session state
    this.selectionState = new SelectionState(doc)
    // surface manager takes care of surfaces, keeps track of the currently focused surface
    // and makes sure the DOM selection is rendered properly at the end of a flow
    this.surfaceManager = new SurfaceManager(this)
    // this context is provided to commands, tools, etc.
    this._context = {
      editSession: this,
      //legacy
      surfaceManager: this.surfaceManager,
      documentSession: this,
    }
    // to expose custom context just provide optios.context
    if (options.context) {
      Object.assign(this._context, options.context)
    }

    if (!options.configurator) {
      throw new Error('No configurator provided.')
    }
    let configurator = options.configurator
    let commands = configurator.getCommands()
    let dragHandlers = configurator.createDragHandlers()
    let macros = configurator.getMacros()
    let converterRegistry = configurator.getConverterRegistry()
    let editingBehavior = configurator.getEditingBehavior()

    // The command manager keeps the commandStates up-to-date
    this.commandManager = new CommandManager(this._context, commands)
    // The drag manager dispatches drag requests to registered drag handlers
    // TODO: after consolidating the API of this class, we probably need a less diverse context
    this.dragManager = new DragManager(dragHandlers, Object.assign({}, this._context, {
      commandManager: this.commandManager
    }))
    // The macro manager dispatches to macro detectors at the end of the flow
    this.macroManager = new MacroManager(this._context, macros)
    this.globalEventHandler = new GlobalEventHandler(this, this.surfaceManager)
    this.markersManager = new MarkersManager(this)
    // TODO: see how we want to expose these
    this.converterRegistry = converterRegistry
    this.editingBehavior = editingBehavior
  }

  dispose() {
    this.surfaceManager.dispose()
    this.commandManager.dispose()
    this.dragManager.dispose()
    this.macroManager.dispose()
    this.globalEventHandler.dispose()
    this.markersManager.dispose()
  }

  getDocument() {
    return this.doc
  }

  getSelection() {
    return this.selectionState.getSelection()
  }

  // @flows
  setSelection(sel) {
    if (sel && !sel.surfaceId) {
      let fs = this.getFocusedSurface()
      if (fs) {
        sel.surfaceId = fs.id
      }
    }
    if (sel && isPlainObject(sel)) {
      sel = this.doc.createSelection(sel)
    }
    var selectionHasChanged = this._setSelection(sel)
    if(selectionHasChanged) {
      this._isDirty['selection'] = true
      this.set('selection', sel)
      this.startFlow()
    }
  }

  getFocusedSurface() {
    return this.surfaceManager.getFocusedSurface()
  }

  hasChanged(key) {
    return Boolean(this._isDirty[key])
  }

  get(key) {
    return this._data[key]
  }

  set(key, value) {
    this._data[key] = value
    this._isDirty[key] = true
  }

  startFlow() {
    if (this._flowing) return
    this._flowing = true
    try {
      this.stages.forEach((stage) => {
        this.emit(stage, this)
      })
    } finally {
      this._isDirty = {}
      this._flowing = false
    }
  }

  createSelection() {
    return this.doc.createSelection.apply(this.doc, arguments)
  }

  getSelectionState() {
    return this.selectionState
  }

  /*
    Set saveHandler via API

    E.g. if saveHandler not available at construction
  */
  setSaveHandler(saveHandler) {
    this.saveHandler = saveHandler
  }

  getCollaborators() {
    return null
  }

  canUndo() {
    return this.doneChanges.length > 0
  }

  canRedo() {
    return this.undoneChanges.length > 0
  }

  undo() {
    this._undoRedo('undo')
  }

  redo() {
    this._undoRedo('redo')
  }

  _undoRedo(which) {
    var from, to
    if (which === 'redo') {
      from = this.undoneChanges
      to = this.doneChanges
    } else {
      from = this.doneChanges
      to = this.undoneChanges
    }
    var change = from.pop()
    if (change) {
      this.stage._apply(change)
      this.doc._apply(change)
      var sel = change.after.selection
      if (sel) {
        sel.attach(this.doc)
      }
      var selectionHasChanged = this._setSelection(sel)
      to.push(change.invert())
      this.set('change', change)
      if (selectionHasChanged) {
        this.set('selection', sel)
      }
      this.startFlow()
    } else {
      console.warn('No change can be %s.', (which === 'undo'? 'undone':'redone'))
    }
  }

  /**
    Start a transaction to manipulate the document

    @param {function} transformation a function(tx) that performs actions on the transaction document tx

    @example

    ```js
    doc.transaction(function(tx, args) {
      tx.update(...)
      ...
      return {
        selection: newSelection
      }
    })
    ```

    @flows
  */
  transaction(transformation, info) {
    if (this.isTransacting) {
      throw new Error('Nested transactions are not supported.')
    }
    this.isTransacting = true
    this.stage.reset()
    var sel = this.getSelection()
    info = info || {}
    var surfaceId = sel.surfaceId
    var change = this.stage._transaction(function(tx) {
      tx.before.selection = sel
      var args = { selection: sel }
      var result = transformation(tx, args) || {}
      sel = result.selection || sel
      if (sel._isSelection && !sel.isNull() && !sel.surfaceId) {
        sel.surfaceId = surfaceId
      }
      tx.after.selection = sel
      extend(info, tx.info)
    })
    if (change) {
      this.isTransacting = false
      this._commit(change, info)
      return change
    } else {
      this.isTransacting = false
    }
  }

  _setSelection(sel) {
    return this.selectionState.setSelection(sel)
  }

  _transformLocalChangeHistory(externalChange) {
    // Transform the change history
    // Note: using a clone as the transform is done inplace
    // which is ok for the changes in the undo history, but not
    // for the external change
    var clone = {
      ops: externalChange.ops.map(function(op) { return op.clone(); })
    }
    DocumentChange.transformInplace(clone, this.doneChanges)
    DocumentChange.transformInplace(clone, this.undoneChanges)
  }

  _transformSelection(change) {
    var oldSelection = this.getSelection()
    var newSelection = DocumentChange.transformSelection(oldSelection, change)
    // console.log('Transformed selection', change, oldSelection.toString(), newSelection.toString())
    return newSelection
  }

  _commit(change, info) {
    var selectionHasChanged = this._commitChange(change)

    this.set('change', change)
    this.set('info', info)
    if (selectionHasChanged) {
      this.set('selection', this.getSelection())
    }
    this.startFlow()
  }

  _commitChange(change) {
    change.timestamp = Date.now()
    // update document model
    this.doc._apply(change)

    var currentChange = this._currentChange
    // try to merge this change with the last to get more natural changes
    // e.g. not every keystroke, but typed words or such.
    var merged = false
    if (currentChange) {
      if (this.compressor.shouldMerge(currentChange, change)) {
        merged = this.compressor.merge(currentChange, change)
      }
    }
    if (!merged) {
      // push to undo queue and wipe the redo queue
      this._currentChange = change
      this.doneChanges.push(change.invert())
    }
    // discard old redo history
    this.undoneChanges = []

    var newSelection = change.after.selection || Selection.nullSelection
    var selectionHasChanged = this._setSelection(newSelection)
    // HACK injecting the surfaceId here...
    // TODO: we should find out where the best place is to do this
    if (!newSelection.isNull()) {
      newSelection.surfaceId = change.after.surfaceId
    }
    return selectionHasChanged
  }

  /*
    Are there unsaved changes?
  */
  isDirty() {
    return this._dirty
  }

  /*
    Save session / document
  */
  save() {
    var doc = this.getDocument()
    var saveHandler = this.saveHandler

    if (this._dirty && !this._isSaving) {
      this._isSaving = true
      // Pass saving logic to the user defined callback if available
      if (saveHandler) {
        // TODO: calculate changes since last save
        var changes = []
        saveHandler.saveDocument(doc, changes, function(err) {

          this._isSaving = false
          if (err) {
            console.error('Error during save')
          } else {
            this._dirty = false
            this._triggerUpdateEvent({}, {force: true})
          }
        }.bind(this))

      } else {
        console.error('Document saving is not handled at the moment. Make sure saveHandler instance provided to documentSession')
      }
    }
  }

  _triggerUpdateEvent(update, info) { //eslint-disable-line
    // info = info || {}
    // info.session = this
    // if (update.change && update.change.ops.length > 0) {
    //   // TODO: I would like to wrap this with a try catch.
    //   // however, debugging gets inconvenient as caught exceptions don't trigger a breakpoint
    //   // by default, and other libraries such as jquery throw noisily.
    //   this.doc._notifyChangeListeners(update.change, info)
    //   this._dirty = true
    // } else {
    //   // HACK: removing this from the update when it is NOP
    //   // this way, we only need to do this check here
    //   delete update.change
    // }
    // // TODO: these will be removed soon
    // if (Object.keys(update).length > 0 || info.force) {
    //   // slots to have more control about when things get
    //   // updated, and things have been rendered/updated
    //   // this.emit('update', update, info)
    //   // this.emit('didUpdate', update, info)
    // }
  }
}

export default DocumentSession
