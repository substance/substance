import parseKeyEvent from '../util/parseKeyEvent'
import HandlerParams from './HandlerParams'

export default class AbstractKeyboardManager {
  onKeydown (event, context) {
    const key = parseKeyEvent(event)
    const hooks = this._getBindings('keydown', key)
    if (hooks) {
      context = context || this._getContext()
      const params = this._getParams(context)
      let hasExecuted = false
      for (let i = 0; i < hooks.length && !hasExecuted; i++) {
        const hook = hooks[i]
        hasExecuted = hook(params, context)
      }
      if (hasExecuted) {
        event.preventDefault()
        event.stopPropagation()
      }
      return hasExecuted
    }
  }

  onTextInput (text, context) {
    const hooks = this._getBindings('textinput', text)
    if (hooks) {
      context = context || this._getContext()
      const params = this._getParams(context)
      let hasExecuted = false
      for (let i = 0; i < hooks.length && !hasExecuted; i++) {
        const hook = hooks[i]
        hasExecuted = hook(params, context)
      }
      return hasExecuted
    }
  }

  _getParams (context) {
    return new HandlerParams(context)
  }

  _getBindings (type, key) {
    throw new Error('This method is abstract')
  }

  _getContext () {
    throw new Error('This method is abstract')
  }
}
