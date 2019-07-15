import { getKeyForPath } from '../util'
import { copySelection } from '../model'
import SurfaceManager from './SurfaceManager'
import MarkersManager from './MarkersManager'
import KeyboardManager from './KeyboardManager'
import CommandManager from './CommandManager'
import FindAndReplaceManager from './FindAndReplaceManager'

export default function EditorSessionMixin (AbstractEditorSession) {
  class BaseEditorSession extends AbstractEditorSession {
    /**
     * @param {Configurator} config
     * @param {object} options
     * @param {boolean} options.inherit true if commands and keyboard shortcuts should be inherited from parent configurations.
     */
    _setup (config, options = {}) {
      this.config = config
      const editorState = this.editorState

      let surfaceManager = new SurfaceManager(editorState)
      let markersManager = new MarkersManager(editorState)
      let keyboardManager = new KeyboardManager(config.getKeyboardShortcuts(options), (commandName, params) => {
        return this.executeCommand(commandName, params)
      }, this)
      let commandManager = new CommandManager(this,
        // update commands when document or selection have changed
        // TODO: is this really sufficient?
        ['document', 'selection'],
        config.getCommands(options)
      )
      let findAndReplaceManager = new FindAndReplaceManager(this)
      this.surfaceManager = surfaceManager
      this.markersManager = markersManager
      this.keyboardManager = keyboardManager
      this.commandManager = commandManager
      this.findAndReplaceManager = findAndReplaceManager

      // has to be set before initialisation
      this.context = null

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
      this.editorState.removeObserver(this)
      this.surfaceManager.dispose()
      this.markersManager.dispose()
      this.commandManager.dispose()
      this.findAndReplaceManager.dispose()
    }

    _createEditorState (document, initialState = {}) {
      return Object.assign(super._createEditorState(document, initialState), {
        focusedSurface: null,
        commandStates: {},
        overlayId: null,
        findAndReplace: FindAndReplaceManager.defaultState()
      })
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

    getSurfaceForProperty (path) {
      return this.surfaceManager._getSurfaceForProperty(path)
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
  return BaseEditorSession
}
