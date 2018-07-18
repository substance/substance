import AbstractKeyboardManager from '../ui/AbstractKeyboardManager'
import parseKeyCombo from '../util/parseKeyCombo'

/*
  @deprecated: we are trying to untangle editorSession and managers try to
  find a better way how to pass context
*/
export default class DeprecatedKeyboardManager extends AbstractKeyboardManager {
  constructor (editorSession, bindings, options) {
    super()

    this.editorSession = editorSession
    this.context = options.context || {}

    this.keydownBindings = {}
    this.textInputBindings = {}

    bindings.forEach(({ key, spec }) => {
      // default combos are evaluated on keydown
      let type = spec.type || 'keydown'
      if (spec.command) {
        let handler = new ExecuteCommandHandler(editorSession, spec.command)
        let hook = handler.execute.bind(handler)
        if (type === 'keydown') {
          key = parseKeyCombo(key)
          if (!this.keydownBindings[key]) this.keydownBindings[key] = []
          this.keydownBindings[key].push(hook)
        } else if (type === 'textinput') {
          // TODO: do we have multiple textinputBindings too?
          this.textInputBindings[key] = hook
        }
      } else {
        throw new Error('Keyboard binding not supported', spec)
      }
    })
  }

  _getKeydownBindings (key) {
    return this.keydownBindings[key]
  }

  _getTextInputBindings (text) {
    return this.textInputBindings[text]
  }

  _getParams () {
    const context = this.context
    const editorSession = context.editorSession
    const surfaceManager = context.surfaceManager
    const selection = editorSession.getSelection()
    const selectionState = editorSession.getSelectionState()
    let surface = surfaceManager.getFocusedSurface()
    return {
      editorSession,
      selection,
      selectionState,
      surface
    }
  }

  _getContext () {
    return this.context
  }

  static parseCombo (...args) { return parseKeyCombo(...args) }
}

class ExecuteCommandHandler {
  constructor (editorSession, commandName) {
    this.editorSession = editorSession
    this.commandName = commandName
  }

  execute (params) {
    let commandState = params.editorSession.getCommandStates()[this.commandName]
    if (!commandState || commandState.disabled) return false
    this.editorSession.executeCommand(this.commandName, params)
    return true
  }
}
