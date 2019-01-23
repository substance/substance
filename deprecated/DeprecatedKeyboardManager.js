import AbstractKeyboardManager from '../ui/AbstractKeyboardManager'
import parseKeyCombo from '../util/parseKeyCombo'
import parseKeyEvent from '../util/parseKeyEvent'

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
          key = parseKeyEvent(parseKeyCombo(key))
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

  _getBindings (type, key) {
    switch (type) {
      case 'keydown':
        return this.keydownBindings[key]
      case 'textinput':
        return this.textInputBindings[key]
      default:
        throw new Error('Unsupported keyboard event type')
    }
  }

  _getContext () {
    return this.context
  }

  static parseCombo (...args) { return parseKeyEvent(parseKeyCombo(...args)) }
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
