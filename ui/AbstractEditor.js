import Component from './Component'
import CommandManager from './CommandManager'
import MacroManager from './MacroManager'
import GlobalEventHandler from './GlobalEventHandler'
import SurfaceManager from '../packages/surface/SurfaceManager'
import DragManager from './DragManager'

class AbstractEditor extends Component {

  constructor(...args) {
    super(...args)
    this._initialize(this.props)
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
    this.documentSession.off(this)
    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty()
  }

  getChildContext() {
    return {
      controller: this,
      iconProvider: this.iconProvider,
      documentSession: this.documentSession,
      doc: this.doc, // TODO: remove in favor of documentSession
      componentRegistry: this.componentRegistry,
      surfaceManager: this.surfaceManager,
      commandManager: this.commandManager,
      tools: this.tools,
      labelProvider: this.labelProvider,
      converterRegistry: this.converterRegistry,
      globalEventHandler: this.globalEventHandler,
      editingBehavior: this.editingBehavior,
      dragManager: this.dragManager,
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
    this.tools = configurator.getTools()
    this.surfaceManager = new SurfaceManager(this.documentSession)
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

  documentSessionUpdated() {
    throw new Error('This method is abstract')
  }
}

export default AbstractEditor
