import isFunction from '../util/isFunction'
import isString from '../util/isString'
import findIndex from '../util/findIndex'

/*
  Internal implementation used to store event bindings.
*/
class DOMEventListener {

  constructor(eventName, handler, options) {
    if (!isString(eventName) || !isFunction(handler)) {
      throw new Error("Illegal arguments: 'eventName' must be a String, and 'handler' must be a Function.")
    }
    options = options || {}
    var origHandler = handler
    var context = options.context
    var capture = Boolean(options.capture)

    if (context) {
      handler = handler.bind(context)
    }
    if (options.once === true) {
      handler = _once(this, handler)
    }

    this.eventName = eventName
    this.originalHandler = origHandler
    this.handler = handler
    this.capture = capture
    this.context = context
    this.options = options
    // set when this gets attached to a DOM element
    this._el = null
  }

}

DOMEventListener.prototype._isDOMEventListener = true

DOMEventListener.findIndex = function(eventListeners, eventName, handler) {
  var idx = -1
  if (arguments[1]._isDOMEventListener) {
    idx = eventListeners.indexOf(arguments[1])
  } else {
    idx = findIndex(eventListeners,
      _matches.bind(null, {
        eventName: eventName,
        originalHandler: handler
      })
    )
  }
  return idx
}

function _matches(l1, l2) {
  return l1.eventName === l2.eventName && l1.originalHandler === l2.originalHandler
}

function _once(listener, handler) {
  return function(event) {
    handler(event)
    listener._el.removeEventListener(listener)
  }
}

export default DOMEventListener