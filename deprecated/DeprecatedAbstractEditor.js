import Component from '../ui/Component'
import DOMSelection from '../ui/DOMSelection'
import ResourceManager from './DeprecatedResourceManager'

/**
  Reusable abstract editor implementation.

  @deprecated: we have moved away of using this, as this approach
  has shown to be not flexible enough for more complex application setups.
  Particularly problematic is the large number of 'Managers' owned by this
  class. In applications with multiple documents and editors, it is necessary
  to have more control over the creation of these.

  @example

  ```js
  class SimpleWriter extends AbstractEditor {
    render($$) {
      // render editor
    }
  }
  ```
*/
export default class DeprecatedAbstractEditor extends Component {
  constructor (...args) {
    super(...args)

    this._initialize(this.props)
  }

  didMount () {
    // Connect editorSession with editor component
    this.getEditorSession().attachEditor(this)
  }

  dispose () {
    this._dispose()
  }

  _initialize (props) {
    const editorSession = props.editorSession
    if (!editorSession) {
      throw new Error('EditorSession instance required')
    }
    this.editorSession = editorSession
    this.doc = editorSession.getDocument()

    let configurator = editorSession.getConfigurator()
    this.componentRegistry = configurator.getComponentRegistry()
    this.commandGroups = configurator.getCommandGroups()
    this.keyboardShortcuts = configurator.getKeyboardShortcutsByCommand()
    this.tools = configurator.getTools()
    this.labelProvider = configurator.getLabelProvider()
    this.iconProvider = configurator.getIconProvider()

    // legacy
    this.surfaceManager = editorSession.surfaceManager
    this.commandManager = editorSession.commandManager
    this.dragManager = editorSession.dragManager
    this.macroManager = editorSession.macroManager
    this.converterRegistry = editorSession.converterRegistry
    this.globalEventHandler = editorSession.globalEventHandler
    this.editingBehavior = editorSession.editingBehavior
    this.markersManager = editorSession.markersManager

    this.resourceManager = new ResourceManager(editorSession, this.getChildContext())
    this.domSelection = new DOMSelection(this)

    // initialize the label provider
    this.labelProvider.setLanguage(editorSession.getLanguage())
    // if the language is changed update the LabelProvider
    // and do a force rerender
    editorSession.onUpdate('lang', (lang) => {
      this.labelProvider.setLanguage(lang)
    }, this)
    editorSession.onRender('lang', this.rerender, this)
  }

  willReceiveProps (nextProps) {
    let newSession = nextProps.editorSession
    let shouldDispose = newSession && newSession !== this.editorSession
    if (shouldDispose) {
      this._dispose()
      this._initialize(nextProps)
    }
  }

  _dispose () {
    const editorSession = this.getEditorSession()
    editorSession.off(this)
    editorSession.detachEditor(this)
    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty()
    // not necessary
    // this.domSelection.dispose()
    this.resourceManager.dispose()
  }

  getChildContext () {
    return {
      editor: this,
      editorSession: this.editorSession,
      doc: this.doc, // NOTE: deprecated, use document
      document: this.doc,
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
      commandGroups: this.commandGroups,
      tools: this.tools,
      keyboardShortcuts: this.keyboardShortcuts
    }
  }

  /*
    Handle document key down events.
  */
  onKeyDown (event) {
    // ignore fake IME events (emitted in IE and Chromium)
    if (event.key === 'Dead') return
    // Handle custom keyboard shortcuts globally
    let custom = this.editorSession.keyboardManager.onKeydown(event)
    return custom
  }

  getDocument () {
    return this.editorSession.getDocument()
  }

  getConfigurator () {
    return this.editorSession.getConfigurator()
  }

  getEditorSession () {
    return this.editorSession
  }

  getComponentRegistry () {
    return this.componentRegistry
  }

  getSurfaceManager () {
    return this.surfaceManager
  }

  getLabelProvider () {
    return this.labelProvider
  }
}
