import parseKeyEvent from '../util/parseKeyEvent'
import HandlerParams from './HandlerParams'

export default class AbstractKeyboardManager {
  onKeydown (event, context) {
    let key = parseKeyEvent(event)
    let hooks = this._getKeydownBindings(key)
    if (hooks) {
      context = context || this._getContext()
      let params = this._getParams(context)
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
    let hooks = this._getTextInputBindings(text)
    if (hooks) {
      context = context || this._getContext()
      let params = this._getParams(context)
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

  _getKeydownBindings (key) {
    throw new Error('This method is abstract')
  }

  _getTextInputBindings (text) {
    throw new Error('This method is abstract')
  }

  _getContext () {
    throw new Error('This method is abstract')
  }
}
