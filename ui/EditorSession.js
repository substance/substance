import { getKeyForPath } from '../util'
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
  constructor (id, document, config, editor, initialEditorState = {}) {
    super(id, document, initialEditorState)

    const editorState = this.editorState
    this._config = config
    this._editor = editor
    this._contextProvider = editor

    let surfaceManager = new SurfaceManager(editorState)
    let markersManager = new MarkersManager(editorState)
    let globalEventHandler = new GlobalEventHandler(editorState)
    let keyboardManager = new KeyboardManager(config.getKeyboardShortcuts(), (commandName, params) => {
      return this.executeCommand(commandName, params)
    }, this._contextProvider)
    let commandManager = new CommandManager(editorState,
      // update commands when document or selection have changed
      // TODO: is this really sufficient?
      ['document', 'selection'],
      config.getCommands(),
      this._contextProvider
    )
    let findAndReplaceManager = new FindAndReplaceManager(this, editorState, editor)

    this.surfaceManager = surfaceManager
    this.markersManager = markersManager
    this.globalEventHandler = globalEventHandler
    this.keyboardManager = keyboardManager
    this.commandManager = commandManager
    this.findAndReplaceManager = findAndReplaceManager
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

  executeCommand (commandName, params) {
    return this.commandManager.executeCommand(commandName, params)
  }

  getCommandStates () {
    return this.editorState.commandStates
  }

  getConfigurator () {
    return this._config
  }

  getContext () {
    return this.contextProvider.context
  }

  getFocusedSurface () {
    return this.editorState.focusedSurface
  }

  getSurface (surfaceId) {
    return this.surfaceManager.getSurface(surfaceId)
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
