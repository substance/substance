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

  _initialize(props) {
    let configurator = props.configurator
    if (!props.documentSession && !props.editSession) {
      throw new Error('DocumentSession instance required');
    }
    this.editSession = props.editSession || props.documentSession
    this.doc = this.editSession.getDocument()
    this.componentRegistry = configurator.getComponentRegistry()
    this.toolGroups = configurator.getToolGroups()

    this.labelProvider = configurator.getLabelProvider()
    this.iconProvider = configurator.getIconProvider()

    // legacy
    this.documentSession = this.editSession
    this.surfaceManager = this.editSession.surfaceManager
    this.commandManager = this.editSession.commandManager
    this.dragManager = this.editSession.dragManager
    this.macroManager = this.editSession.macroManager
    this.converterRegistry = this.editSession.converterRegistry
    this.globalEventHandler = this.editSession.globalEventHandler
    this.editingBehavior = this.editSession.editingBehavior
    this.markersManager = this.editSession.markersManager
  }

  /**
    Define the editors render method here.
  */
  render(...args) {
    super.render(...args)
  }

  willReceiveProps(nextProps) {
    let newSession = nextProps.editSession || nextProps.documentSession
    let shouldDispose = newSession && newSession !== this.editSession
    if (shouldDispose) {
      this._dispose()
      this._initialize(nextProps)
    }
  }

  dispose() {
    this._dispose()
  }

  _dispose() {
    this.editSession.off(this)
    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty()
  }

  getChildContext() {
    return {
      editor: this,
      controller: this,
      editSession: this.editSession,
      documentSession: this.editSession,
      doc: this.doc, // TODO: remove in favor of editSession
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
}

export default AbstractEditor
