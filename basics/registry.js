'use strict';

var oo = require('./oo');

/**
 * Simple registry implementation.
 *
 * @class Registry
 * @constructor
 * @module Basics
 */
function Registry() {
  this.entries = {};
  // used to control order
  this.names = [];
}

Registry.Prototype = function() {

  /**
   * Check if an entry is registered for a given name.
   *
   * @param {String} name
   * @method contains
   */
  this.contains = function(name) {
    return !!this.entries[name];
  };

  /**
   * Add an entry to the registry.
   *
   * @param {String} name
   * @param {Object} entry
   * @method add
   */
  this.add = function(name, entry) {
    if (this.contains(name)) {
      this.remove(name);
    }
    this.entries[name] = entry;
    this.names.push(name);
  };

  /**
   * Remove an entry from the registry.
   *
   * @param {String} name
   * @method remove
   */
  this.remove = function(name) {
    var pos = this.names.indexOf(name);
    if (pos >= 0) {
      this.names.splice(pos, 1);
    }
    delete this.entries[name];
  };

  this.clear = function() {
    this.names = [];
    this.entries = [];
  };

  /**
   * Get the entry registered for a given name.
   *
   * @param {String} name
   * @return The registered entry
   * @method get
   */
  this.get = function(name) {
    var res = this.entries[name];
    return res;
  };

  /**
   * Iterate all registered entries in the order they were registered.
   *
   * @param {Function} callback with signature function(entry, name)
   * @param {Object} execution context
   * @method each
   */
  this.each = function(callback, ctx) {
    for (var i = 0; i < this.names.length; i++) {
      var name = this.names[i];
      var _continue = callback.call(ctx, this.entries[name], name);
      if (_continue === false) {
        break;
      }
    }
  };
};

oo.initClass(Registry);

module.exports = Registry;
