import forEach from './forEach'
import isObject from './isObject'

// for debugging
const DEBUG = true
let count = 0
const COUNT_MSG = '%s listeners registered in the whole system.'

/**
  Event support.
*/
class EventEmitter {

  /**
    Emit an event.

    @param {String} event
    @param ...arguments
    @return true if a listener was notified, false otherwise.
   */
  emit(event) {
    if (event in this.__events__) {
      // console.log("Emitting event %s (%d listeners) on", event, this.__events__[event].length, this)
      // Clone the list of bindings so that handlers can remove or add handlers during the call.
      var bindings = this.__events__[event].slice()
      var args = Array.prototype.slice.call(arguments, 1)
      for (var i = 0, len = bindings.length; i < len; i++) {
        var binding = bindings[i]
        // console.log("- triggering %s on %s", event, binding.context.constructor.name)
        binding.method.apply(binding.context, args)
      }
      return true
    }
    return false
  }

  /**
    Subscribe a listener to an event.

    Optionally, a `priority` can be provided to control the order
    of all bindings. The default priority is 0. All listeners with the
    same priority remain in order of registration.
    A lower priority will make the listener be called later, a higher
    priority earlier.

    @param {String} event
    @param {Function} method
    @param {Object} context
   */
  on(event, method, context) {
    // TODO: we could add options like 'once'
    _on.call(this, event, method, context)
  }

  /**
    Unsubscribe a listener from an event.

    @param {String} event
    @param {Function} method
    @param {Object} context
   */
  off(event, method, context) { // eslint-disable-line no-unused-vars
    if (arguments.length === 1 && isObject(arguments[0])) {
      _disconnect.call(this, arguments[0])
    } else {
      _off.apply(this, arguments)
    }
  }

  _debugEvents() {
    /* eslint-disable no-console */
    console.log('### EventEmitter: ', this)
    forEach(this.__events__, (handlers, name) => {
      console.log("- %s listeners for %s: ", handlers.length, name, handlers)
    })
    /* eslint-enable no-console */
  }

  get __events__() {
    if (!this.___events___) {
      this.___events___ = {}
    }
    return this.___events___
  }

}

/*
  Internal implementation for registering a listener.

  @param {String} event
  @param {Function} method
  @param {Object} context
 */
function _on(event, method, context) {
  /* eslint-disable no-invalid-this */
  var bindings
  validateMethod( method, context )
  if (this.__events__.hasOwnProperty(event)) {
    bindings = this.__events__[event]
  } else {
    // Auto-initialize bindings list
    bindings = this.__events__[event] = []
  }
  // Add binding
  bindings.push({
    method: method,
    context: context || null
  })
  if (DEBUG) {
    count++
    console.info('_on()', event, method.name, context, this)
    console.info(COUNT_MSG, count)
  }
  return this
  /*eslint-enable no-invalid-this */
}

/*
  Remove a listener.

  @param {String} event
  @param {Function} method
  @param {Object} context
 */
function _off(event, method, context) {
  /* eslint-disable no-invalid-this */
  if (arguments.length === 0) {
    if (DEBUG) {
      forEach(this.__events__, (bindings) => {
        bindings.forEach((b) => {
          console.info('_off()', b.method.name, b.context, this)
        })
        count -= bindings.length
      })
      console.info(COUNT_MSG, count)
    }
    this.___events___ = {}
    return this
  }
  if (arguments.length === 1) {
    // Remove all bindings for event
    if (DEBUG) {
      count -= (this.__events__[event] || []).length
      console.info(COUNT_MSG, count)
    }
    delete this.__events__[event]
    return this
  }
  validateMethod(method, context)
  if (!(event in this.__events__) || !this.__events__[event].length) {
    if (DEBUG) console.info('NO MATCHING BINDINGS')
    // No matching bindings
    return this
  }
  console.info('_off()', event, method.name, context, this)
  // Default to null context
  if (arguments.length < 3) {
    context = null
  }
  // Remove matching handlers
  let bindings = this.__events__[event]
  for (let i = bindings.length-1; i >= 0; i--) {
    const b = bindings[i]
    if (b[i].method === method && b[i].context === context) {
      bindings.splice(i, 1)
      if (DEBUG) count--
    }
  }
  // Cleanup if now empty
  if (bindings.length === 0) {
    delete this.__events__[event]
  }
  if (DEBUG) console.info(COUNT_MSG, count)
  return this
  /* eslint-enable no-invalid-this */
}

// removes a listener from all events
function _disconnect(context) {
  /* eslint-disable no-invalid-this */
  // Remove all connections to the context
  forEach(this.__events__, (bindings, event) => {
    for (let i = bindings.length-1; i>=0; i--) {
      // bindings[i] may have been removed by the previous steps
      // so check it still exists
      if (bindings[i] && bindings[i].context === context) {
        _off.call(this, event, bindings[i].method, context)
      }
    }
  })
  return this
  /* eslint-enable no-invalid-this */
}

function validateMethod(method, context) {
  // Validate method and context
  if (typeof method === 'string') {
    // Validate method
    if (context === undefined || context === null) {
      throw new Error( 'Method name "' + method + '" has no context.' )
    }
    if (!(method in context)) {
      // Technically the method does not need to exist yet: it could be
      // added before call time. But this probably signals a typo.
      throw new Error( 'Method not found: "' + method + '"' )
    }
    if (typeof context[method] !== 'function') {
      // Technically the property could be replaced by a function before
      // call time. But this probably signals a typo.
      throw new Error( 'Property "' + method + '" is not a function' )
    }
  } else if (typeof method !== 'function') {
    throw new Error( 'Invalid callback. Function or method name expected.' )
  }
}

export default EventEmitter
