import { getKeyForPath } from '../util'
import { copySelection } from '../model'
import AbstractEditorSession from './AbstractEditorSession'
import SurfaceManager from './SurfaceManager'
import MarkersManager from './MarkersManager'
import GlobalEventHandler from './GlobalEventHandler'
import KeyboardManager from './KeyboardManager'
import CommandManager from './CommandManager'
import FindAndReplaceManager from './FindAndReplaceManager'

export default class EditorSession extends AbstractEditorSession {
  /**
   * @param {string} id a unique name for this editor session
   * @param {Document} document
   * @param {Configurator} config
   * @param {object} contextProvider an object with getContext()
   * @param {object|EditorState} editorState a plain object with intial values or an EditorState instance for reuse
   */
  constructor (id, document, config, initialEditorState = {}) {
    super(id, document, initialEditorState)

    const editorState = this.editorState
    this.config = config

    let surfaceManager = new SurfaceManager(editorState)
    let markersManager = new MarkersManager(editorState)
    let globalEventHandler = new GlobalEventHandler(editorState)
    let keyboardManager = new KeyboardManager(config.getKeyboardShortcuts(), (commandName, params) => {
      return this.executeCommand(commandName, params)
    }, this)
    let commandManager = new CommandManager(this,
      // update commands when document or selection have changed
      // TODO: is this really sufficient?
      ['document', 'selection'],
      config.getCommands(),
      this._contextProvider
    )
    let findAndReplaceManager = new FindAndReplaceManager(this)

    this.surfaceManager = surfaceManager
    this.markersManager = markersManager
    this.globalEventHandler = globalEventHandler
    this.keyboardManager = keyboardManager
    this.commandManager = commandManager
    this.findAndReplaceManager = findAndReplaceManager

    // ATTENTION: we need a root DOM element e.g. for finding surfaces
    // An editor component should call something like
    // ```
    // editorSession.setRootComponent(editor.getContent())
    // ```
    // during didMount()
    this._rootComponent = null
  }

  initialize () {
    super.initialize()

    // EXPERIMENTAL: registering a 'reducer' that resets overlayId whenever the selection changes
    this.editorState.addObserver(['selection'], this._resetOverlayId, this, { stage: 'update' })
    this.commandManager.initialize()
  }

  dispose () {
    super.dispose()
    this.findAndReplaceManager.dispose()
    this.commandManager.dispose()
    this.globalEventHandler.dispose()
    this.markersManager.dispose()
    this.surfaceManager.dispose()
  }

  _createEditorState (document, initialState = {}) {
    return Object.assign({
      focusedSurface: null,
      commandStates: {},
      overlayId: null,
      findAndReplace: FindAndReplaceManager.defaultState()
    }, super._createEditorState(document, initialState))
  }

  copy () {
    const sel = this.getSelection()
    const doc = this.getDocument()
    if (sel && !sel.isNull() && !sel.isCollapsed()) {
      return copySelection(doc, sel)
    }
  }

  cut () {
    const sel = this.getSelection()
    if (sel && !sel.isNull() && !sel.isCollapsed()) {
      let snippet = this.copy()
      this.deleteSelection()
      return snippet
    }
  }

  deleteSelection (options) {
    const sel = this.getSelection()
    if (sel && !sel.isNull() && !sel.isCollapsed()) {
      this.transaction(tx => {
        tx.deleteSelection(options)
      }, { action: 'deleteSelection' })
    }
  }

  paste (content, options) {
    this.transaction(tx => {
      tx.paste(content, options)
    }, { action: 'paste' })
    return true
  }

  insertText (text) {
    const sel = this.getSelection()
    if (sel && !sel.isNull()) {
      this.transaction(tx => {
        tx.insertText(text)
      }, { action: 'insertText' })
    }
  }

  executeCommand (commandName, params) {
    return this.commandManager.executeCommand(commandName, params)
  }

  getCommandStates () {
    return this.editorState.commandStates
  }

  getConfig () {
    return this.config
  }

  getContext () {
    return this.context
  }

  setContext (context) {
    this.context = context
  }

  getFocusedSurface () {
    return this.editorState.focusedSurface
  }

  getSurface (surfaceId) {
    return this.surfaceManager.getSurface(surfaceId)
  }

  setRootComponent (rootComponent) {
    this._rootComponent = rootComponent
  }

  getRootComponent () {
    return this._rootComponent
  }

  _resetOverlayId () {
    const overlayId = this.editorState.overlayId
    // overlayId === getKeyForPath(path) => if selection is value &&
    // Overlays of value components (ManyRelationshipComponent, SingleRelationship)
    // need to remain open if the selection is a value selection
    let sel = this.getSelection()
    if (sel && sel.customType === 'value') {
      let valueId = getKeyForPath(sel.data.path)
      if (overlayId !== valueId) {
        this.editorState.set('overlayId', valueId)
      }
    } else {
      this.editorState.set('overlayId', null)
    }
  }
}
