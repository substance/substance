import Component from './Component'

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
      editor: this,
      controller: this,
      editSession: this.documentSession,
      documentSession: this.documentSession,
      doc: this.doc, // TODO: remove in favor of documentSession
      componentRegistry: this.componentRegistry,
      surfaceManager: this.surfaceManager,
      commandManager: this.commandManager,
      markersManager: this.markersManager,
      converterRegistry: this.converterRegistry,
      dragManager: this.dragManager,
      editingBehavior: this.editingBehavior,
      globalEventHandler: this.globalEventHandler,
      iconProvider: this.iconProvider,
      labelProvider: this.labelProvider,
      // ATTENTION: this is a map of tool target names to maps of tool names to tools
      // i.e. a declarative way to map tools to tool groups
      tools: this.tools,
    }
  }

  _initialize(props) {
    let configurator = props.configurator
    if (!props.documentSession) {
      throw new Error('DocumentSession instance required');
    }
    this.documentSession = props.documentSession
    this.doc = this.documentSession.getDocument()
    this.componentRegistry = configurator.getComponentRegistry()
    this.tools = configurator.getTools()

    // legacy
    this.surfaceManager = this.documentSession.surfaceManager
    this.commandManager = this.documentSession.commandManager
    this.dragManager = this.documentSession.dragManager
    this.macroManager = this.documentSession.macroManager
    this.converterRegistry = this.documentSession.converterRegistry
    this.globalEventHandler = this.documentSession.globalEventHandler
    this.editingBehavior = this.documentSession.editingBehavior
    this.markersManager = this.documentSession.markersManager

    this.labelProvider = configurator.getLabelProvider()
    this.iconProvider = configurator.getIconProvider()
  }
}

export default AbstractEditor
