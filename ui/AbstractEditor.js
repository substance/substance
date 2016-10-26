import Component from './Component'

/**
  Reusable abstract editor implementation.

  @example

  ```js
  class SimpleWriter extends AbstractEditor {
    render($$) {
      // render editor
    }
  }
  ```
*/
class AbstractEditor extends Component {

  constructor(...args) {
    super(...args)
    this._initialize(this.props)
  }

  _initialize(props) {
    if (!props.editorSession) {
      throw new Error('EditorSession instance required');
    }
    this.editorSession = props.editorSession
    this.doc = this.editorSession.getDocument()

    let configurator = this.editorSession.getConfigurator()
    this.componentRegistry = configurator.getComponentRegistry()
    this.toolGroups = configurator.getToolGroups()
    this.labelProvider = configurator.getLabelProvider()
    this.iconProvider = configurator.getIconProvider()

    // legacy
    this.surfaceManager = this.editorSession.surfaceManager
    this.commandManager = this.editorSession.commandManager
    this.dragManager = this.editorSession.dragManager
    this.macroManager = this.editorSession.macroManager
    this.converterRegistry = this.editorSession.converterRegistry
    this.globalEventHandler = this.editorSession.globalEventHandler
    this.editingBehavior = this.editorSession.editingBehavior
    this.markersManager = this.editorSession.markersManager
  }

  /**
    Define the editors render method here.
  */
  render(...args) {
    super.render(...args)
  }

  willReceiveProps(nextProps) {
    let newSession = nextProps.editorSession
    let shouldDispose = newSession && newSession !== this.editorSession
    if (shouldDispose) {
      this._dispose()
      this._initialize(nextProps)
    }
  }

  dispose() {
    this._dispose()
  }

  _dispose() {
    this.editorSession.off(this)
    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty()
  }

  getChildContext() {
    return {
      editor: this,
      editorSession: this.editorSession,
      doc: this.doc, // TODO: remove in favor of editorSession
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
      toolGroups: this.toolGroups,
    }
  }

  getConfigurator() {
    return this.editorSession.getConfigurator()
  }

  getEditorSession() {
    return this.editorSession
  }

  getComponentRegistry() {
    return this.componentRegistry
  }
}

export default AbstractEditor
