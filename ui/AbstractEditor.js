import Component from './Component'
import ResourceManager from './ResourceManager'
import DOMSelection from './DOMSelection'
import { DefaultDOMElement } from '../dom'
import { platform } from '../util'

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

  didMount() {
    // Connect editorSession with editor component
    this.getEditorSession().attachEditor(this)
  }

  dispose() {
    this._dispose()
  }

  _initialize(props) {
    if (!props.editorSession) {
      throw new Error('EditorSession instance required');
    }
    this.editorSession = props.editorSession
    this.doc = this.editorSession.getDocument()

    let configurator = this.editorSession.getConfigurator()
    this.componentRegistry = configurator.getComponentRegistry()
    this.commandGroups = configurator.getCommandGroups()
    this.keyboardShortcuts = configurator.getKeyboardShortcutsByCommand()
    this.tools = configurator.getTools()
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

    if (platform.inBrowser) {
      let documentEl = DefaultDOMElement.wrapNativeElement(window.document)
      documentEl.on('keydown', this.onKeyDown, this)
    }
  }

  willReceiveProps(nextProps) {
    let newSession = nextProps.editorSession
    let shouldDispose = newSession && newSession !== this.editorSession
    if (shouldDispose) {
      this._dispose()
      this._initialize(nextProps)
    }
  }

  _dispose() {
    this.getEditorSession().detachEditor(this)
    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty()
    // not necessary
    // this.domSelection.dispose()
    this.resourceManager.dispose()
    if (platform.inBrowser) {
      let documentEl = DefaultDOMElement.wrapNativeElement(window.document)
      documentEl.off(this)
    }
  }

  getChildContext() {
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
  onKeyDown(event) {
    // ignore fake IME events (emitted in IE and Chromium)
    if ( event.key === 'Dead' ) return
    // Handle custom keyboard shortcuts globally
    let custom = this.editorSession.keyboardManager.onKeydown(event)
    return custom
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
}

export default AbstractEditor
