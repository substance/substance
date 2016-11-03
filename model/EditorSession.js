import DocumentChange from '../model/DocumentChange'
import MarkersManager from '../model/MarkersManager'
import Selection from '../model/Selection'
import SelectionState from '../model/SelectionState'
import ChangeHistory from '../model/ChangeHistory'
import SurfaceManager from '../packages/surface/SurfaceManager'
import TransactionDocument from '../model/TransactionDocument'
import CommandManager from '../ui/CommandManager'
import DragManager from '../ui/DragManager'
import Editing from '../ui/Editing'
import GlobalEventHandler from '../ui/GlobalEventHandler'
import MacroManager from '../ui/MacroManager'
import KeyboardManager from '../ui/KeyboardManager'
import forEach from '../util/forEach'
import isPlainObject from '../util/isPlainObject'
import isFunction from '../util/isFunction'
import isString from '../util/isString'
import EventEmitter from '../util/EventEmitter'
import FileManager from './FileManager'

class EditorSession extends EventEmitter {

  constructor(doc, options) {
    super()

    options = options || {}

    this.document = doc
    if (!options.configurator) {
      throw new Error('No configurator provided.')
    }
    this.configurator = options.configurator

    // the stage is essentially a clone of the document used to apply a sequence of document operations
    // without touching this document
    this._transactionDocument = new TransactionDocument(doc, this)
    // while in session.transaction() this will is true
    this._isTransacting = false

    this._history = new ChangeHistory()
    // used for change accumulation (in a collab environment)
    this._currentChange = null

    // TODO: while it is good to have these selection
    // related derived state informations separated
    // it would feel better to have the selection itself
    // as a property of this session
    this._selectionState = new SelectionState(doc)

    this._commandStates = []

    // the session exposes these resources, and keeps track of changes
    this._resources = ['document', 'selection', 'commandStates']
    // flags to keep track which resources have changed since the last 'flow'
    this._dirtyFlags = {}
    // set during a change
    this._change = null
    this._info = null

    this._flowStages = ['update', 'render', 'post-render', 'position', 'finalize']
    // to get something executed directly after a flow
    this._postponed = []

    this._observers = {}

    // TODO: do we really want this?
    this._hasUnsavedChanges = false
    this._isSaving = false
    this._saveHandler = options.saveHandler

    this._lang = options.lang || this.configurator.getDefaultLanguage()
    this._dir = options.dir || 'ltr'

    // Managers
    // --------

    // surface manager takes care of surfaces, keeps track of the currently focused surface
    // and makes sure the DOM selection is rendered properly at the end of a flow
    this.surfaceManager = new SurfaceManager(this)
    // this context is provided to commands, tools, etc.
    this._context = {
      editorSession: this,
      //legacy
      surfaceManager: this.surfaceManager,
    }
    // to expose custom context just provide optios.context
    if (options.context) {
      Object.assign(this._context, options.context)
    }

    let configurator = this.configurator
    let commands = configurator.getCommands()
    let dragHandlers = configurator.createDragHandlers()
    let macros = configurator.getMacros()
    let converterRegistry = configurator.getConverterRegistry()
    let editingBehavior = configurator.getEditingBehavior()

    this.editing = new Editing(this, editingBehavior)

    this.fileManager = options.fileManager || new FileManager(this, configurator.getFileAdapters(), this._context)

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
    this.keyboardManager = new KeyboardManager(this, configurator.getKeyboardShortcuts(), {
      context: this._context
    })

    // TODO: see how we want to expose these
    this.converterRegistry = converterRegistry
    this.editingBehavior = editingBehavior
  }

  dispose() {
    this.surfaceManager.dispose()
    this.fileManager.dispose()
    this.commandManager.dispose()
    this.dragManager.dispose()
    this.macroManager.dispose()
    this.globalEventHandler.dispose()
    this.markersManager.dispose()
  }

  hasChanged(resource) {
    return this._dirtyFlags[resource]
  }

  hasDocumentChanged() {
    return this.hasChanged('document')
  }

  hasSelectionChanged() {
    return this.hasChanged('selection')
  }

  hasCommandStatesChanged() {
    return this.hasChanged('commandStates')
  }

  hasLanguageChanged() {
    return this.hasChanged('lang')
  }

  hasTextDirectionChanged() {
    return this.hasChanged('dir')
  }

  get(resourceName) {
    switch(resourceName) {
      case 'document':
        return this.getDocument()
      case 'selection':
        return this.getSelection()
      case 'commandStates':
        return this.getCommandStates()
      case 'change':
        return this.getChange()
      default:
        throw new Error('Unknown resource: ' + resourceName)
    }
  }

  getConfigurator() {
    return this.configurator
  }

  getDocument() {
    return this.document
  }

  getSelection() {
    return this.getSelectionState().getSelection()
  }

  getSelectionState() {
    return this._selectionState
  }

  getCommandStates() {
    return this._commandStates
  }

  getChange() {
    return this._change
  }

  getChangeInfo() {
    return this._info
  }

  getFocusedSurface() {
    return this.surfaceManager.getFocusedSurface()
  }

  getSurface(surfaceId) {
    return this.surfaceManager.getSurface(surfaceId)
  }

  getLanguage() {
    return this._lang
  }

  getTextDirection() {
    return this._dir
  }

  canUndo() {
    return this._history.canUndo()
  }

  canRedo() {
    return this._history.canRedo()
  }

  executeCommand(...args) {
    this.commandManager.executeCommand(...args)
  }

  setSelection(sel) {
    if (sel && !sel.surfaceId) {
      let fs = this.getFocusedSurface()
      if (fs) {
        sel.surfaceId = fs.id
      }
    }
    if (sel && isPlainObject(sel)) {
      sel = this.getDocument().createSelection(sel)
    }
    if (this._setSelection(sel)) {
      this.startFlow()
    }
  }

  selectNode(nodeId) {
    let surface = this.getFocusedSurface()
    this.setSelection({
      type: 'node',
      nodeId: nodeId,
      mode: 'full',
      containerId: surface.getContainerId(),
      surfaceId: surface.id
    })
  }

  setCommandStates(commandStates) {
    this._commandStates = commandStates
    this._setDirty('commandStates')
  }

  setLanguage(lang) {
    if (this._lang !== lang) {
      this._lang = lang
      this._setDirty('lang')
      this.startFlow()
    }
  }

  setTextDirection(dir) {
    if (this._dir !== dir) {
      this._dir = dir
      this._setDirty('dir')
      this.startFlow()
    }
  }

  createSelection() {
    const doc = this.getDocument()
    return doc.createSelection.apply(doc, arguments)
  }

  getCollaborators() {
    return null
  }

  /*
    Set saveHandler via API

    E.g. if saveHandler not available at construction
  */
  setSaveHandler(saveHandler) {
    this._saveHandler = saveHandler
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
  */
  transaction(transformation, info) {
    if (this.isTransacting) {
      throw new Error('Nested transactions are not supported.')
    }
    const tx = this._transactionDocument
    this.isTransacting = true
    tx.reset()
    var sel = this.getSelection()
    info = info || {}
    var surfaceId = sel.surfaceId
    var change = tx._transaction(function(tx) {
      tx.before.selection = sel
      var args = { selection: sel }
      var result = transformation(tx, args) || {}
      sel = result.selection || sel
      if (sel._isSelection && !sel.isNull() && !sel.surfaceId) {
        sel.surfaceId = surfaceId
      }
      tx.after.selection = sel
      Object.assign(info, tx.info)
    })
    if (change) {
      this.isTransacting = false
      this._commit(change, info)
      return change
    } else {
      this.isTransacting = false
    }
  }

  undo() {
    this._undoRedo('undo')
  }

  redo() {
    this._undoRedo('redo')
  }

  /**
    Registers a hook for the `update` phase.

    During `update` data should be derived necessary for rendering.

    This is mainly used by extensions of the EditorSession to
    derive extra state information.

    @param {string} [resource] the name of the resource
    @param {Function} handler the function handler
    @param {Object} context owner of the handler
    @param {Object} [options] options for the resource handler

  */
  onUpdate(...args) {
    return this._registerObserver('update', args)
  }

  /**
    Registers a hook for the 'render' phase.

    During `render`, components should be rerendered.

    @param {string} [resource] the name of the resource
    @param {Function} handler the function handler
    @param {Object} context owner of the handler
    @param {Object} [options] options for the resource handler

    @example

    This typically used by components that render node content.

    ```js
    class ImageComponent extends Component {
      didMount() {
        this.context.editorSession.onRender('document', this.rerender, this, {
          path: [this.props.node.id, 'src']
        })
      }
      dispose() {
        this.context.editorSession.off(this)
      }
      render($$) {
        ...
      }
    }
    ```
  */
  onRender(...args) {
    return this._registerObserver('render', args)
  }

  /**
    Registers a hook for the 'post-render' phase.

    ATM, this phase is used internally only, for recovering the DOM selection
    which typically gets destroyed due to rerendering

    @internal

    @param {string} [resource] the name of the resource
    @param {Function} handler the function handler
    @param {Object} context owner of the handler
    @param {Object} [options] options for the resource handler
  */
  onPostRender(...args) {
    return this._registerObserver('post-render', args)
  }

  /**
    Registers a hook for the 'position' phase.

    During `position`, components such as Overlays, for instance, should be positioned.
    At this stage, it is guaranteed that all content is rendered, and the DOM selection
    is set.

    @param {string} [resource] the name of the resource
    @param {Function} handler the function handler
    @param {Object} context owner of the handler
    @param {Object} [options] options for the resource handler

  */
  onPosition(...args) {
    return this._registerObserver('position', args)
  }

  onFinalize(...args) {
    return this._registerObserver('finalize', args)
  }

  /*
    Low-level implementation for hook registration

    @param {string} stage name of stage
    @param {Function} handler handler function
    @param {Object} observer context of the handler function
    @param {Object} [options]

    @example

    Called when a flow stage is executed:

    ```js
    editorSession.on('update', this._onSessionUpdate, this)
    ```

    Called at a specific flow stage but only if a resource has changed:

    ```js
    editorSession.on('update', this._onSelectionUpdate, this, {
      resource: 'selection'
    })
    ```
    which is equivalent to
    ```js
    editorSession.onUpdate('selection', this._onSelectionUpdate, this)
    ```

    Called at a specific flow stage but only if a property has changed:
    ```js
    editorSession.on('update', this._onPropertyChanged, this, {
      resource: 'document',
      path: [node.id, 'content']
    })
    ```
  */
  // on(stage, ...args) {
  //   return this._registerObserver(stage, args)
  // }

  off(observer) {
    super.off(observer)
    this._deregisterObserver(observer)
  }

  _setSelection(sel) {
    let hasChanged = this.getSelectionState().setSelection(sel)
    if (hasChanged) this._setDirty('selection')
    return hasChanged
  }

  _undoRedo(which) {
    const doc = this.getDocument()
    const tx = this._transactionDocument
    var from, to
    if (which === 'redo') {
      from = this._history.undoneChanges
      to = this._history.doneChanges
    } else {
      from = this._history.doneChanges
      to = this._history.undoneChanges
    }
    var change = from.pop()
    if (change) {
      this._applyChange(change, {})
      // keep tx in sync
      tx._apply(change)
      // move change to the opposite change list (undo <-> redo)
      to.push(change.invert())
      // use selection from change
      let sel = change.after.selection
      if (sel) sel.attach(doc)
      this._setSelection(sel)
      // finally trigger the flow
      this.startFlow()
    } else {
      console.warn('No change can be %s.', (which === 'undo'? 'undone':'redone'))
    }
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
    this._commitChange(change, info)
    this.startFlow()
  }

  _commitChange(change, info) {
    change.timestamp = Date.now()
    this._applyChange(change, info)
    if (info['history'] !== false) {
      this._history.push(change.invert())
    }
    var newSelection = change.after.selection || Selection.nullSelection
    // HACK injecting the surfaceId here...
    // TODO: we should find out where the best place is to do this
    if (!newSelection.isNull() && !newSelection.surfaceId) {
      newSelection.surfaceId = change.after.surfaceId
    }
    this._setSelection(newSelection)
  }

  _applyChange(change, info) {
    this.getDocument()._apply(change)
    this._setDirty('document')
    this._change = change
    this._info = info
  }

  /*
    Are there unsaved changes?
  */
  hasUnsavedChanges() {
    return this._hasUnsavedChanges
  }

  /*
    Save session / document
  */
  save() {
    var doc = this.getDocument()
    var saveHandler = this.saveHandler

    if (this._hasUnsavedChanges && !this._isSaving) {
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
            this._hasUnsavedChanges = false
            // af
            this._triggerUpdateEvent({}, {force: true})
          }
        }.bind(this))

      } else {
        console.error('Document saving is not handled at the moment. Make sure saveHandler instance provided to editorSession')
      }
    }
  }

  /*
    Starts the flow.

    This is necessary when changing resources managed by the session.
    To be able to change multiple resources at the same time,
    this is not done automatically, but needs to be called
    by the implementation.

    @internal
  */
  startFlow() {
    if (this._flowing) return
    this._flowing = true
    try {
      this.performFlow()
    } finally {
      this._resetFlow()
      this._flowing = false
    }
    // Note: postponing is ATM used only by Macros
    // HACK: to avoid having multiple flows at the same time
    // we are running this deferred
    const postponed = this._postponed
    const self = this
    this._postponed = []
    setTimeout(function() {
      postponed.forEach(function(fn) {
        fn(self)
      })
    }, 0)
  }

  /*
    Emits the phases in the correct order.

    @internal
  */
  performFlow() {
    this._flowStages.forEach((stage) => {
      this._notifyObservers(stage)
    })
  }

  postpone(fn) {
    this._postponed.push(fn)
  }

  _parseObserverArgs(args) {
    let params = { resource: null, handler: null, context: null, options: {} }
    // first can be a string
    let idx = 0
    let arg = args[idx]
    if (isString(arg)) {
      params.resource = arg
      idx++
      arg = args[idx]
    }
    if (!arg) {
      throw new Error('Provided handler function was nil.')
    }
    if (!isFunction(arg)) {
      throw new Error('Expecting a handler Function.')
    }
    params.handler = arg
    idx++
    arg = args[idx]
    if (arg) {
      params.context = arg
      idx++
      arg = args[idx]
    }
    if (arg) {
      params.options = arg
    }
    return params
  }

  _registerObserver(stage, args) {
    let observer = this._parseObserverArgs(args)
    let observers = this._observers[stage]
    if (!observers) {
      observers = this._observers[stage] = []
    }
    observers.push(observer)
  }

  _deregisterObserver(observer) {
    // TODO: we should optimize this, as ATM this needs to traverse
    // a lot of registered listeners
    forEach(this._observers, function(observers) {
      for (var i = 0; i < observers.length; i++) {
        var entry = observers[i]
        if (entry.context === observer) {
          // console.log('## removing observer')
          observers.splice(i, 1)
          i--
        }
      }
    })
  }

  _notifyObservers(stage) {
    // TODO: this is not hierarchical anymore
    // i.e. probably we have to expect degradation of performance
    // with huuuge documents, as the number of listeners is
    // We could optimize this by 'compiling' a list of observers for
    // each configuration, maybe lazily
    // for now we accept this circumstance
    const observers = this._observers[stage]
    if (!observers) return
    observers.forEach((o) => {
      if (!o.resource) {
        o.handler.call(o.context, this)
      } else if (o.resource === 'document') {
        if (!this.hasDocumentChanged()) return
        const change = this.getChange()
        const info = this.getChangeInfo()
        const path = o.options.path
        if (!path) {
          o.handler.call(o.context, change, info, this)
        } else if (change.isAffected(path)) {
          o.handler.call(o.context, change, info, this)
        }
      } else {
        if (!this.hasChanged(o.resource)) return
        const resource = this.get(o.resource)
        o.handler.call(o.context, resource, this)
      }
    })
  }

  _setDirty(resource) {
    this._dirtyFlags[resource] = true
  }

  _resetFlow() {
    Object.keys(this._dirtyFlags).forEach((resource) => {
      this._dirtyFlags[resource] = false
    })
    this._change = null
    this._info = null
  }

}

export default EditorSession
