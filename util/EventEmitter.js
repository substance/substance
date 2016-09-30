import forEach from 'lodash/forEach'
import isObject from 'lodash/isObject'

/**
  Event support.

  @class
  @private
*/
class EventEmitter {

  /**
   * Emit an event.
   *
   * @param {String} event
   * @param ...arguments
   * @return true if a listener was notified, false otherwise.
   */
  emit(event) {
    if (event in this.__events__) {
      // console.log("Emitting event %s (%d listeners) on", event, this.__events__[event].length, this)
      // Clone the list of bindings so that handlers can remove or add handlers during the call.
      var bindings = this.__events__[event].slice()
      var args = Array.prototype.slice.call(arguments, 1)
      for (var i = 0, len = bindings.length; i < len; i++) {
        var binding = bindings[i]
        // console.log("- triggering %s", binding.context.constructor.type)
        binding.method.apply(binding.context, args)
      }
      return true
    }
    return false
  }

  /**
   * Connect a listener to a set of events.
   *
   * Optionally, a `priority` can be provided to control the order
   * of all bindings. The default priority is 0. All listeners with the
   * same priority remain in order of registration.
   * A lower priority will make the listener be called later, a higher
   * priority earlier.
   *
   * @param {Object} listener
   * @param {Object} hash with event as keys, and handler functions as values.
   * @param {Number} hash with `priority` as ordering hint (default is 0).
   * @chainable
   */
  connect (obj, methods, options) { // eslint-disable-line no-unused-vars
    console.warn('DEPRECATED: Use EventEmitter.on(event, method, context) instead.')
    return _connect.apply(this, arguments)
  }

  /**
   * Disconnect a listener (all bindings).
   *
   * @method disconnect
   * @param {Object} listener
   * @chainable
   */
  disconnect(listener) {
    console.warn('DEPRECATED: Use EventEmitter.off(listener) instead.')
    return _disconnect.call(this, listener)
  }

  /**
   * Subscribe a listener to an event.
   *
   * @param {String} event
   * @param {Function} method
   * @param {Object} context
   * @param {Object} options
   */
  on(event, method, context, options) {
    var priority = 0
    if (arguments.length === 4) {
      priority = options.priority || priority
    }
    _on.call(this, event, method, context, priority)
    this.__events__[event].sort(byPriorityDescending)
  }

  /**
   * Unsubscrive a listener from an event.
   *
   * @param {String} event
   * @param {Function} method
   * @param {Object} context
   * @param {Object} options
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
    forEach(this.__events__, function(handlers, name) {
      console.log("- %s listeners for %s: ", handlers.length, name, handlers)
    })
    /* eslint-enable no-console */
  }
}

// sort descending as a listener with higher priority should be
// called earlier
function byPriorityDescending(a, b) {
  return b.priority - a.priority
}

/*
  Internal implementation for registering a listener.

  @param {String} event
  @param {Function} method
  @param {Object} context
 */
function _on(event, method, context, priority) {
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
    context: context || null,
    priority: priority
  })
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
  var i, bindings
  if ( arguments.length === 1 ) {
    // Remove all bindings for event
    delete this.__events__[event]
    return this
  }
  validateMethod( method, context )
  if ( !( event in this.__events__ ) || !this.__events__[event].length ) {
    // No matching bindings
    return this
  }
  // Default to null context
  if ( arguments.length < 3 ) {
    context = null
  }
  // Remove matching handlers
  bindings = this.__events__[event]
  i = bindings.length
  while ( i-- ) {
    if ( bindings[i].method === method && bindings[i].context === context ) {
      bindings.splice( i, 1 )
    }
  }
  // Cleanup if now empty
  if ( bindings.length === 0 ) {
    delete this.__events__[event]
  }
  return this
  /* eslint-enable no-invalid-this */
}

/*
  Internal implementation of connect.
 */
function _connect(obj, methods, options) {
  /* eslint-disable no-invalid-this */
  var priority = 0
  if (arguments.length === 3) {
    priority = options.priority || priority
  }
  forEach(methods, function(method, event) {
    _on.call(this, event, method, obj, priority)
    this.__events__[event].sort(byPriorityDescending)
  }.bind(this))
  return this
  /* eslint-enable no-invalid-this */
}

/**
  Internal implementation of disconnect.
 */
function _disconnect(context) {
  /* eslint-disable no-invalid-this */
  // Remove all connections to the context
  forEach(this.__events__, function(bindings, event) {
    for (var i = bindings.length-1; i>=0; i--) {
      // bindings[i] may have been removed by the previous steps
      // so check it still exists
      if (bindings[i] && bindings[i].context === context) {
        _off.call(this, event, bindings[i].method, context)
      }
    }
  }.bind(this))
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

const __events__ = {
  get: function () {
    if (!this.___events___) {
      this.___events___ = {}
    }
    return this.___events___
  },
  configurable: true,
  enumerable: false
}

Object.defineProperty(EventEmitter.prototype, '__events__', __events__)

EventEmitter.mixin = function(clazz) {
  var properties = Object.getOwnPropertyNames(EventEmitter.prototype)
  properties.forEach(function(name) {
    if (name === 'constructor' || name === '__events__') return
    clazz.prototype[name] = EventEmitter.prototype[name]
  })
  Object.defineProperty(clazz.prototype, '__events__', __events__)
}

export default EventEmitter
