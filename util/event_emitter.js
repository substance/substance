'use strict';

var OO = require("./oo");

/**
 * Event support.
 *
 * Inspired by VisualEditor's EventEmitter class.
 *
 * @class EventEmitter
 * @memberof module:Basics
 */
function EventEmitter() {
  this.__events__ = {};
}

EventEmitter.Prototype = function() {

  function validateMethod( method, context ) {
    // Validate method and context
    if ( typeof method === 'string' ) {
      // Validate method
      if ( context === undefined || context === null ) {
        throw new Error( 'Method name "' + method + '" has no context.' );
      }
      if ( !( method in context ) ) {
        // Technically the method does not need to exist yet: it could be
        // added before call time. But this probably signals a typo.
        throw new Error( 'Method not found: "' + method + '"' );
      }
      if ( typeof context[method] !== 'function' ) {
        // Technically the property could be replaced by a function before
        // call time. But this probably signals a typo.
        throw new Error( 'Property "' + method + '" is not a function' );
      }
    } else if ( typeof method !== 'function' ) {
      throw new Error( 'Invalid callback. Function or method name expected.' );
    }
  }

  /**
   * Internal implementation for registering a listener.
   *
   * @param {String} event
   * @param {Function} method
   * @param {Object} context
   * @private
   * @memberof module:Basics.EventEmitter.prototype
   */
  this._on = function ( event, method, context, priority) {
    var bindings;
    validateMethod( method, context );
    if ( this.__events__.hasOwnProperty( event ) ) {
      bindings = this.__events__[event];
    } else {
      // Auto-initialize bindings list
      bindings = this.__events__[event] = [];
    }
    // Add binding
    bindings.push({
      method: method,
      context: context || null,
      priority: priority
    });
    return this;
  };

  /**
   * Remove a listener.
   *
   * @method off
   * @param {String} event
   * @param {Function} method
   * @param {Object} context
   * @chainable
   * @private
   * @memberof module:Basics.EventEmitter.prototype
   */
  this._off = function ( event, method, context ) {
    var i, bindings;
    if ( arguments.length === 1 ) {
      // Remove all bindings for event
      delete this.__events__[event];
      return this;
    }
    validateMethod( method, context );
    if ( !( event in this.__events__ ) || !this.__events__[event].length ) {
      // No matching bindings
      return this;
    }
    // Default to null context
    if ( arguments.length < 3 ) {
      context = null;
    }
    // Remove matching handlers
    bindings = this.__events__[event];
    i = bindings.length;
    while ( i-- ) {
      if ( bindings[i].method === method && bindings[i].context === context ) {
        bindings.splice( i, 1 );
      }
    }
    // Cleanup if now empty
    if ( bindings.length === 0 ) {
      delete this.__events__[event];
    }
    return this;
  };

  /**
   * Internal implementation of connect.
   *
   * @method _connect
   * @private
   * @memberof module:Basics.EventEmitter.prototype
   */
  this._connect = function (obj, methods, options) {
    var priority = 0;
    if (arguments.length === 3) {
      priority = options.priority || priority;
    }
    for ( var event in methods ) {
      var method = methods[event];
      this._on( event, method, obj, priority);
    }
    this.__events__[event].sort(byPriorityDescending);
    return this;
  };

  /**
   * Internal implementation of disconnect.
   *
   * @method _disconnect
   * @private
   * @memberof module:Basics.EventEmitter.prototype
   */
  this._disconnect = function(context) {
    var i, event, bindings;
    // Remove all connections to the context
    for ( event in this.__events__ ) {
      bindings = this.__events__[event];
      i = bindings.length;
      while ( i-- ) {
        // bindings[i] may have been removed by the previous step's
        // this.off so check it still exists
        if ( bindings[i] && bindings[i].context === context ) {
          this._off( event, bindings[i].method, context );
        }
      }
    }
    return this;
  };

  /**
   * Emit an event.
   *
   * @method emit
   * @memberof module:Basics.EventEmitter.prototype
   * @param {String} event
   * @param ...arguments
   * @return true if a listener was notified, false otherwise.
   */
  this.emit = function (event) {
    if ( event in this.__events__ ) {
      // Clone the list of bindings so that handlers can remove or add handlers during the call.
      var bindings = this.__events__[event].slice();
      var args = Array.prototype.slice.call(arguments, 1);
      for (var i = 0, len = bindings.length; i < len; i++) {
        var binding = bindings[i];
        binding.method.apply(binding.context, args);
      }
      return true;
    }
    return false;
  };

  // sort descending as a listener with higher priority should be
  // called earlier
  function byPriorityDescending(a, b) {
    return b.priority - a.priority;
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
   * @method emit
   * @memberof module:Basics.EventEmitter.prototype
   * @param {Object} listener
   * @param {Object} hash with event as keys, and handler functions as values.
   * @param {Number} hash with `priority` as ordering hint (default is 0).
   * @chainable
   */
  this.connect = function (obj, methods, options) {
    /* jshint unused:false */
    return this._connect.apply(this, arguments);
  };

  /**
   * Disconnect a listener (all bindings).
   *
   * @method disconnect
   * @memberof module:Basics.EventEmitter.prototype
   * @param {Object} listener
   * @chainable
   */
  this.disconnect = function(listener) {
    return this._disconnect(listener);
  };

  /**
   * Subscribe a listener to a event.
   *
   * @param {String} event
   * @param {Function} method
   * @param {Object} context
   * @param {Object} options
   * @memberof module:Basics.EventEmitter.prototype
   */
  this.on = function(event, method, context, options) {
    var priority = 0;
    if (arguments.length === 4) {
      priority = options.priority || priority;
    }
    this._on(event, method, context, priority);
    this.__events__[event].sort(byPriorityDescending);
  };

  /**
   * Unsubscrive a listener from an event.
   *
   * @param {String} event
   * @param {Function} method
   * @param {Object} context
   * @param {Object} options
   * @memberof module:Basics.EventEmitter.prototype
   */
  this.off = function(event, method, context) {
    /* jshint unused:false */
    // TODO: we could add sugar to be able to be able to just use
    // emitter.off('event', this)
    // i.e., without need to specify the handler again
    return this._off.apply(this, arguments);
  };
};

OO.initClass( EventEmitter );

module.exports = EventEmitter;
