import Component from './Component'
import Flow from './Flow'
import DocumentSessionFlowAdapter from './DocumentSessionFlowAdapter'
import CommandManager from './CommandManager'
import MacroManager from './MacroManager'
import GlobalEventHandler from './GlobalEventHandler'
import SurfaceManager from '../packages/surface/SurfaceManager'
import SurfaceFlowAdapter from '../packages/surface/SurfaceFlowAdapter'
import DragManager from './DragManager'

/**
  Reusable abstract editor implementation.

  @example

  ```js
  class SimpleWriter extends AbstractEditor {

    render($$) {
      // render editor
    }

    documentSessionUpdated() {
      // actions in response to doc session updates. E.g. updating a toolbar
    }
  }
  ```
*/
class AbstractEditor extends Component {

  constructor(...args) {
    super(...args)
    this._initialize(this.props)
  }

  /**
    Define the editors render method here.
  */
  render(...args) {
    super.render(...args)
  }

  didMount() {
    this.documentSession.on('didUpdate', this.documentSessionUpdated, this)
  }

  willReceiveProps(nextProps) {
    let newSession = nextProps.documentSession
    let shouldDispose = newSession && newSession !== this.documentSession
    if (shouldDispose) {
      this._dispose()
      this._initialize(nextProps)
    }
  }

  dispose() {
    this._dispose()
  }

  _dispose() {
    this.surfaceManager.dispose()
    this.commandManager.dispose()
    this.globalEventHandler.dispose()
    this.dragManager.dispose()
    this.flow.dispose()
    this.documentSession.off(this)
    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty()
  }

  getChildContext() {
    return {
      controller: this,
      documentSession: this.documentSession,
      doc: this.doc, // TODO: remove in favor of documentSession
      flow: this.flow,
      componentRegistry: this.componentRegistry,
      surfaceManager: this.surfaceManager,
      commandManager: this.commandManager,
      converterRegistry: this.converterRegistry,
      dragManager: this.dragManager,
      editingBehavior: this.editingBehavior,
      globalEventHandler: this.globalEventHandler,
      iconProvider: this.iconProvider,
      labelProvider: this.labelProvider,
      tools: this.tools,
    }
  }

  _initialize(props) {
    let configurator = props.configurator
    let commands = configurator.getCommands()
    if (!props.documentSession) {
      throw new Error('DocumentSession instance required');
    }
    this.documentSession = props.documentSession
    this.doc = this.documentSession.getDocument()
    this.componentRegistry = configurator.getComponentRegistry()
    this.flow = this._setupFlow()
    this.tools = configurator.getTools()
    this.surfaceManager = new SurfaceManager(this.flow, this.documentSession)
    this.commandManager = new CommandManager(this.getCommandContext(), commands)
    this.dragManager = new DragManager(configurator.createDragHandlers(), {
      documentSession: this.documentSession,
      surfaceManager: this.surfaceManager,
      commandManager: this.commandManager,
    });
    this.macroManager = new MacroManager(this.getMacroContext(), configurator.getMacros())
    this.iconProvider = configurator.getIconProvider()
    this.converterRegistry = configurator.getConverterRegistry()
    this.globalEventHandler = new GlobalEventHandler(this.documentSession, this.surfaceManager)
    this.editingBehavior = configurator.getEditingBehavior()
    this.labelProvider = configurator.getLabelProvider()
  }

  _setupFlow() {
    // TODO: make stages configurable
    const flow = new Flow(['model', 'pre-render', 'render', 'post-render', 'final'])
    // will feed resources scoped to doc.id
    DocumentSessionFlowAdapter.connect(flow, this.documentSession)
    // will feed resources scoped to surface.id
    SurfaceFlowAdapter.connect(flow, this.documentSession)
    return flow
  }

  getCommandContext() {
    return {
      documentSession: this.documentSession,
      surfaceManager: this.surfaceManager
    }
  }

  getMacroContext() {
    return {
      documentSession: this.documentSession,
      surfaceManager: this.surfaceManager
    }
  }

  /**
    Called when documentSession was updated (e.g. when the selection changes).

    E.g. update toolbars.
  */
  documentSessionUpdated() {
    throw new Error('This method is abstract')
  }
}

export default AbstractEditor
