import { getKeyForPath } from '../util'
import StageSession from './StageSession'
import SurfaceManager from './SurfaceManager'
import MarkersManager from './MarkersManager'
import KeyboardManager from './KeyboardManager'
import CommandManager from './CommandManager'

// TODO: extract shareble code (see EditorSession)
export default class ModalEditorSession extends StageSession {
  constructor (id, parentEditorSession, config, initialEditorState) {
    super(id, parentEditorSession, initialEditorState)

    const editorState = this.editorState
    this._config = config

    let surfaceManager = new SurfaceManager(editorState)
    let markersManager = new MarkersManager(editorState)
    let keyboardManager = new KeyboardManager(config.getKeyboardShortcuts({ inherit: true }), (commandName, params) => {
      return this.executeCommand(commandName, params)
    }, this)
    let commandManager = new CommandManager(this,
      // update commands when document or selection have changed
      // TODO: is this really sufficient?
      ['document', 'selection'],
      config.getCommands({ inherit: true })
    )
    this.surfaceManager = surfaceManager
    this.markersManager = markersManager
    this.keyboardManager = keyboardManager
    this.commandManager = commandManager

    // EXPERIMENTAL: registering a 'reducer' that resets overlayId whenever the selection changes
    this.editorState.addObserver(['selection'], this._resetOverlayId, this, { stage: 'update' })
    this.commandManager.initialize()
  }

  dispose () {
    super.dispose()
    this.commandManager.dispose()
    this.markersManager.dispose()
    this.surfaceManager.dispose()
  }

  _createEditorState (document, initialState = {}) {
    return Object.assign({
      focusedSurface: null,
      commandStates: {}
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
    return this.context
  }

  getFocusedSurface () {
    return this.editorState.focusedSurface
  }

  getSurface (surfaceId) {
    return this.surfaceManager.getSurface(surfaceId)
  }

  setContext (context) {
    this.context = context
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
