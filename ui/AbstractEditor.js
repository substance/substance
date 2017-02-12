import Component from './Component'
import ResourceManager from './ResourceManager'
import DOMSelection from './DOMSelection'

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

    this.resourceManager = new ResourceManager(this.editorSession, this.getChildContext())

    this.domSelection = new DOMSelection(this)
  }

  /**
    Define the editors render method here.
  */
  render(...args) {
    return super.render(...args)
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
      domSelection: this.domSelection,
      commandManager: this.commandManager,
      markersManager: this.markersManager,
      converterRegistry: this.converterRegistry,
      dragManager: this.dragManager,
      editingBehavior: this.editingBehavior,
      globalEventHandler: this.globalEventHandler,
      iconProvider: this.iconProvider,
      labelProvider: this.labelProvider,
      resourceManager: this.resourceManager,
      // ATTENTION: this is a map of tool target names to maps of tool names to tools
      // i.e. a declarative way to map tools to tool groups
      toolGroups: this.toolGroups,
    }
  }

  getDocument() {
    return this.editorSession.getDocument()
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

  onSessionUnlocked() {
    if (this.refs.blocker) {
      this.refs.blocker.remove()
    }
  }
}

export default AbstractEditor
