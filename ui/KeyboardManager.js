import { parseKeyEvent, parseKeyCombo } from '../util'
import AbstractKeyboardManager from './AbstractKeyboardManager'

export default class KeyboardManager extends AbstractKeyboardManager {
  constructor (bindings, commandCallback, contextProvider) {
    super()

    this.contextProvider = contextProvider
    this.bindings = {}

    bindings.forEach(({ key, spec }) => {
      if (!spec.command) throw new Error("'spec.command' is required")
      let hook = () => {
        return commandCallback(spec.command)
      }
      const type = spec.type || 'keydown'
      if (type !== 'textinput') {
        key = parseKeyEvent(parseKeyCombo(key))
      }
      // initializing on-the-fly
      if (!this.bindings[type]) { this.bindings[type] = {} }
      if (!this.bindings[type][key]) { this.bindings[type][key] = [] }
      this.bindings[type][key].push(hook)
    })
  }

  _getBindings (type, key) {
    let bindingsByType = this.bindings[type]
    if (bindingsByType) {
      return bindingsByType[key]
    }
  }

  _getContext () {
    return this.contextProvider.context
  }
}
