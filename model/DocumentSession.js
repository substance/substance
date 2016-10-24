import extend from 'lodash/extend'
import isPlainObject from 'lodash/isPlainObject'
import isFunction from 'lodash/isFunction'
import DocumentChange from '../model/DocumentChange'
import MarkersManager from '../model/MarkersManager'
import Selection from '../model/Selection'
import SelectionState from '../model/SelectionState'
import ChangeHistory from '../model/ChangeHistory'
import SurfaceManager from '../packages/surface/SurfaceManager'
import TransactionDocument from '../model/TransactionDocument'
import CommandManager from '../ui/CommandManager'
import DragManager from '../ui/DragManager'
import GlobalEventHandler from '../ui/GlobalEventHandler'
import MacroManager from '../ui/MacroManager'
import forEach from '../util/forEach'
import Registry from '../util/Registry'

class DocumentSession {

  constructor(doc, options) {
    options = options || {}

    this.document = doc
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

    // TODO: do we really want this?
    this._saveHandler = options.saveHandler

    this._eventProxies = {}

    // Managers
    // --------

    // surface manager takes care of surfaces, keeps track of the currently focused surface
    // and makes sure the DOM selection is rendered properly at the end of a flow
    this.surfaceManager = new SurfaceManager(this)
    // this context is provided to commands, tools, etc.
    this._context = {
      editSession: this,
      //legacy
      documentSession: this,
      surfaceManager: this.surfaceManager,
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

  canUndo() {
    return this._history.canUndo()
  }

  canRedo() {
    return this._history.canRedo()
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

  setCommandStates(commandStates) {
    this._commandStates = commandStates
    this._setDirty('commandStates')
  }

  createSelection() {
    const doc = this.getDocument()
    return doc.createSelection.apply(doc, arguments)
  }

  /*
    Set saveHandler via API

    E.g. if saveHandler not available at construction
  */
  setSaveHandler(saveHandler) {
    this._saveHandler = saveHandler
  }

  getCollaborators() {
    return null
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

  undo() {
    this._undoRedo('undo')
  }

  redo() {
    this._undoRedo('redo')
  }

  /**
    Registers a hook for the `update` phase.

    During `update` data should be derived necessary for rendering.

    This is mainly used by extensions of the EditSession to
    derive extra state information.

    @param {string} [resource] the name of the resource
    @param {Function} handler the function handler
    @param {Object} context owner of the handler
    @param {Object} [options] options for the resource handler

  */
  onUpdate(resource, handler, context, options) {
    return this._registerObserver('update', resource, handler, context, options)
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
        this.context.editSession.onRender('document', this.rerender, this, {
          path: [this.props.node.id, 'src']
        })
      }
      dispose() {
        this.context.editSession.off(this)
      }
      render($$) {
        ...
      }
    }
    ```
  */
  onRender(resource, handler, context, options) {
    return this._registerObserver('render', resource, handler, context, options)
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
  onPostRender(resource, handler, context, options) {
    return this._registerObserver('post-render', resource, handler, context, options)
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
  onPosition(resource, handler, context, options) {
    return this._registerObserver('position', resource, handler, context, options)
  }

  onFinalize(resource, handler, context, options) {
    return this._registerObserver('finalize', resource, handler, context, options)
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
    editSession.on('update', this._onSessionUpdate, this)
    ```

    Called at a specific flow stage but only if a resource has changed:

    ```js
    editSession.on('update', this._onSelectionUpdate, this, {
      resource: 'selection'
    })
    ```
    which is equivalent to
    ```js
    editSession.onUpdate('selection', this._onSelectionUpdate, this)
    ```

    Called at a specific flow stage but only if a property has changed:
    ```js
    editSession.on('update', this._onPropertyChanged, this, {
      resource: 'document',
      path: [node.id, 'content']
    })
    ```
  */
  on(stage, handler, observer, options) {
    let resource = null
    if (options && options.resource) {
      resource = options.resource
    }
    return this._registerObserver(stage, resource, handler, observer, options)
  }

  off(observer) {
    // in every observer we store an array of subscriptions for this session
    let _subscriptions = observer._subscriptions
    if (!_subscriptions) return
    let subscriptions = _subscriptions[this.id]
    if (!subscriptions) return
    // we dispatch the deregistration to the according proxy
    subscriptions.forEach((s) => {
      let proxy = this._eventProxies[s.proxy]
      proxy.off(s)
    })
    delete observer._subscriptions[this.id]
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
    this._history.push(change.invert())
    var newSelection = change.after.selection || Selection.nullSelection
    // HACK injecting the surfaceId here...
    // TODO: we should find out where the best place is to do this
    if (!newSelection.isNull()) newSelection.surfaceId = change.after.surfaceId
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
            // af
            this._triggerUpdateEvent({}, {force: true})
          }
        }.bind(this))

      } else {
        console.error('Document saving is not handled at the moment. Make sure saveHandler instance provided to documentSession')
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

  _notifyObservers(stage) {
    // TODO: this could be optimized by storing the proxies
    // hierarchically, i.e. first by stage, then by resource
    let proxy = this._eventProxies['@'+stage]
    if (proxy) proxy.notifyObservers()
    this._resources.forEach((resource) => {
      let proxy = this._eventProxies[resource+'@'+stage]
      if (proxy) proxy.notifyObservers()
    })
  }

  _registerObserver(stage, resource, handler, context, options) {
    if (isFunction(resource)) {
      options = context
      context = handler
      handler = resource
      resource = null
    }
    let proxyId = (resource ? resource : '') + '@' + stage
    let proxy = this._eventProxies[proxyId]
    // lazy creation of proxies
    if (!proxy) {
      if (!resource) {
        proxy = new StageEventProxy(this, stage)
      } else {
        if (resource === 'document') {
          proxy = new DocumentEventProxy(this, stage)
        } else {
          proxy = new ResourceEventProxy(this, stage, resource)
        }
      }
      this._eventProxies[proxy.id] = proxy
    }
    proxy.registerObserver(handler, context, options)
  }

  _deregisterObserver(observer) {
    // TODO: we should optimize this, as ATM this needs to traverse
    // a lot of registered listeners
    forEach(this._eventProxies, function(proxy) {
      proxy.deregisterObserver(observer)
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

export default DocumentSession

// Event Proxies

class EventProxy {
  constructor(editSession, stage) {
    this.stage = stage
    this.editSession = editSession
    this.observers = []
  }

  dispose() {
    this.observers = []
  }

  registerObserver(handler, observer, options) {
    if (!isFunction(handler)) throw new Error('Invalid argument: handler must be a Function')
    this.observers.push({
      observer: observer,
      handler: handler,
      options: options || {}
    })
  }

  deregisterObserver(observer) {
    for (var i = 0; i < this.observers.length; i++) {
      var entry = this.observers[i]
      if (entry.observer === observer) {
        console.log('## removing observer from', this)
        this.observers.splice(i, 1)
        i--
      }
    }
  }
}

class StageEventProxy extends EventProxy {
  constructor(editSession, stage) {
    super(editSession, stage)
    this.id = '@'+stage
  }
  notifyObservers() {
    this.observers.forEach((o) => {
      o.handler.call(o.observer, this.editSession)
    })
  }
}

class ResourceEventProxy extends EventProxy {
  constructor(editSession, stage, resourceName) {
    super(editSession, stage)
    this.id = resourceName+'@'+stage
    this.resourceName = resourceName
  }
  notifyObservers() {
    const resource = this.editSession.get(this.resourceName)
    this.observers.forEach((o) => {
      o.handler.call(o.observer, resource, this.editSession)
    })
  }
}

class DocumentEventProxy extends EventProxy {
  constructor(editSession, stage) {
    super(editSession, stage)
    this.id = 'document@'+stage
  }

  notifyObservers() {
    const editSession = this.editSession
    const change = editSession.getChange()
    const info = editSession.getChangeInfo()
    if (!change) return
    this.observers.forEach(function(o) {
      let path = o.options.path
      // listeners for all document changes have no path
      if (!path) {
        o.handler.call(o.observer, change, info, editSession)
      }
      // TODO: it might be valueable to provide the old value
      // in case of property listeners
      else if (change.isAffected(path)) {
        o.handler.call(o.observer, change, info, editSession)
      }
    })
  }
}
