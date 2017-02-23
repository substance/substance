import DocumentChange from '../model/DocumentChange'
import MarkersManager from '../model/MarkersManager'
import Selection from '../model/Selection'
import SelectionState from '../model/SelectionState'
import ChangeHistory from '../model/ChangeHistory'
import SurfaceManager from '../packages/surface/SurfaceManager'
import Transaction from '../model/Transaction'
import CommandManager from '../ui/CommandManager'
import DragManager from '../ui/DragManager'
import GlobalEventHandler from '../ui/GlobalEventHandler'
import MacroManager from '../ui/MacroManager'
import KeyboardManager from '../ui/KeyboardManager'
import forEach from '../util/forEach'
import isPlainObject from '../util/isPlainObject'
import uuid from '../util/uuid'
import isFunction from '../util/isFunction'
import isString from '../util/isString'
import EventEmitter from '../util/EventEmitter'
import FileManager from './FileManager'


class EditorSession extends EventEmitter {

  constructor(doc, options) {
    super()

    options = options || {}

    this.id = options.id || uuid()
    this.document = doc
    if (!options.configurator) {
      throw new Error('No configurator provided.')
    }
    this.configurator = options.configurator

    this._transaction = new Transaction(doc, this)

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

    this._flowStages = ['update', 'pre-render', 'render', 'post-render', 'position', 'finalize']
    // to get something executed directly after a flow
    this._postponed = []

    this._observers = {}

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
    let dropHandlers = configurator.getDropHandlers()
    let macros = configurator.getMacros()
    let converterRegistry = configurator.getConverterRegistry()
    let editingBehavior = configurator.getEditingBehavior()

    this.fileManager = options.fileManager || new FileManager(this, configurator.getFileAdapters(), this._context)

    // Handling of saving
    this._hasUnsavedChanges = false
    this._isSaving = false

    if (options.saveHandler) {
      this.saveHandler = options.saveHandler
    } else {
      this.saveHandler = configurator.getSaveHandler()
    }

    // The command manager keeps the commandStates up-to-date
    this.commandManager = new CommandManager(this._context, commands)
    // The drag manager dispatches drag requests to registered drag handlers
    // TODO: after consolidating the API of this class, we probably need a less diverse context
    this.dragManager = new DragManager(dropHandlers, Object.assign({}, this._context, {
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
    // console.log('EditorSession.setSelection()', sel)
    if (sel && isPlainObject(sel)) {
      sel = this.getDocument().createSelection(sel)
    }
    if (sel && !sel.isNull() && !sel.surfaceId) {
      let fs = this.getFocusedSurface()
      if (fs) {
        sel.surfaceId = fs.id
      }
    }
    if (this._setSelection(sel)) {
      this.startFlow()
    }
    return sel
  }

  selectNode(nodeId) {
    let surface = this.getFocusedSurface()
    this.setSelection({
      type: 'node',
      nodeId: nodeId,
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
    this.saveHandler = saveHandler
  }

  /**
    Start a transaction to manipulate the document

    @param {function} transformation a function(tx) that performs actions on the transaction document tx

    @example

    ```js
    doc.transaction(function(tx, args) {
      tx.update(...)
      ...
      tx.setSelection(newSelection)
    })
    ```
  */
  transaction(transformation, info) {
    info = info || {}
    let change = this._transaction._recordChange(transformation, this.getSelection(), this.getFocusedSurface())
    if (change) {
      this._commit(change, info)
    } else {
      // if no changes, at least update the selection
      this._setSelection(this._transaction.getSelection())
      this.startFlow()
    }
    return change
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

  onPreRender(...args) {
    return this._registerObserver('pre-render', args)
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
      this._transaction._apply(change)
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
    DocumentChange.transformInplace(clone, this._history.doneChanges)
    DocumentChange.transformInplace(clone, this._history.undoneChanges)
  }

  _transformSelection(change) {
    var oldSelection = this.getSelection()
    var newSelection = DocumentChange.transformSelection(oldSelection, change)
    // console.log('Transformed selection', change, oldSelection.toString(), newSelection.toString())
    return newSelection
  }

  _commit(change, info) {
    this._commitChange(change, info)
    // TODO: Not sure this is the best place to mark the session dirty
    this._hasUnsavedChanges = true
    this.startFlow()
  }

  _commitChange(change, info) {
    change.timestamp = Date.now()
    this._applyChange(change, info)
    if (info['history'] !== false && !info['hidden']) {
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
    if (!change) {
      console.error('FIXME: change is null.')
      return
    }
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
    var saveHandler = this.saveHandler

    if (this._hasUnsavedChanges && !this._isSaving) {
      this._isSaving = true
      // Pass saving logic to the user defined callback if available
      if (saveHandler) {
        let saveParams = {
          editorSession: this,
          fileManager: this.fileManager
        }
        return saveHandler.saveDocument(saveParams)
        .then(() => {
          this._hasUnsavedChanges = false
          // We update the selection, just so a selection update flow is
          // triggered (which will update the save tool)
          // TODO: model this kind of update more explicitly. It could be an 'update' to the
          // document resource (hasChanges was modified)
          this.setSelection(this.getSelection())
        })
        .catch((err) => {
          console.error('Error during save', err)
        }).then(() => { // finally
          this._isSaving = false
        })
      } else {
        console.error('Document saving is not handled at the moment. Make sure saveHandler instance provided to editorSession')
        return Promise.reject()
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
    forEach(this._observers, (observers) => {
      for (var i = 0; i < observers.length; i++) {
        var entry = observers[i]
        if (entry.context === observer) {
          // console.log('## removing observer')
          observers.splice(i, 1)
          i--
        }
      }
    })
    // add this flag so that we can skip when a listener has deregistered
    // during notification iteration
    observer._deregistered = true
  }

  _notifyObservers(stage) {
    // TODO: this is not hierarchical anymore
    // i.e. probably we have to expect degradation of performance
    // with huuuge documents, as the number of listeners is
    // We could optimize this by 'compiling' a list of observers for
    // each configuration, maybe lazily
    // for now we accept this circumstance
    let _observers = this._observers[stage]
    if (!_observers) return
    // Make a copy so that iteration does not get confused, when listeners deregister
    // TODO: we could improve this by using a custom data structure that allows
    // manipulation during iteration
    let observers = _observers.slice()
    for (let i = 0; i < observers.length; i++) {
      let o = observers[i]
      // an observer might have been deregistered while this iteration was going on
      if (o._deregistered) continue
      if (!o.resource) {
        o.handler.call(o.context, this)
      } else if (o.resource === 'document') {
        if (!this.hasDocumentChanged()) continue
        const change = this.getChange()
        const info = this.getChangeInfo()
        const path = o.options.path
        if (!path) {
          o.handler.call(o.context, change, info, this)
        } else if (change.isAffected(path)) {
          o.handler.call(o.context, change, info, this)
        }
      } else {
        if (!this.hasChanged(o.resource)) continue
        const resource = this.get(o.resource)
        o.handler.call(o.context, resource, this)
      }
    }
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
