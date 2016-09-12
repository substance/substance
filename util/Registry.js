import forEach from 'lodash/forEach'
import oo from './oo'

// just as a reference to detect name collisions
// with native Object properties
var _obj = {};

/*
 * Simple registry implementation.
 *
 * @class Registry
 * @private
 */
function Registry(entries, validator) {
  this.entries = {};
  this.names = [];
  this.validator = validator;

  if (entries) {
    forEach(entries, function(entry, name) {
      this.add(name, entry);
    }.bind(this));
  }
}

Registry.Prototype = function() {

  this._isRegistry = true;

  /**
   * Check if an entry is registered for a given name.
   *
   * @param {String} name
   * @method contains
   * @memberof module:Basics.Registry.prototype
   */
  this.contains = function(name) {
    return this.entries.hasOwnProperty(name);
  };

  /**
   * Add an entry to the registry.
   *
   * @param {String} name
   * @param {Object} entry
   * @method add
   * @memberof module:Basics.Registry.prototype
   */
  this.add = function(name, entry) {
    if (this.validator) {
      this.validator(entry);
    }
    if (_obj[name]) {
      throw new Error('Illegal key: "'+name+'" is a property of Object which is thus not allowed as a key.');
    }
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
   * @memberof module:Basics.Registry.prototype
   */
  this.remove = function(name) {
    var pos = this.names.indexOf(name);
    if (pos >= 0) {
      this.names.splice(pos, 1);
    }
    delete this.entries[name];
  };

  /**
   * @method clear
   * @memberof module:Basics.Registry.prototype
   */
  this.clear = function() {
    this.names = [];
    this.entries = {};
  };

  /**
   * Get the entry registered for a given name.
   *
   * @param {String} name
   * @return The registered entry
   * @method get
   * @memberof module:Basics.Registry.prototype
   */
  this.get = function(name) {
    return this.entries[name];
  };

  /*
   * Iterate all registered entries in the order they were registered.
   *
   * @param {Function} callback with signature function(entry, name)
   * @param {Object} execution context
   */
  this.each = function(callback, ctx) {
    console.warn('DEPRECATED: use Registry.forEach(cb) instead');
    return this.forEach(callback.bind(ctx));
  };

  this.forEach = function(callback) {
    for (var i = 0; i < this.names.length; i++) {
      var name = this.names[i];
      var _continue = callback(this.entries[name], name);
      if (_continue === false) {
        break;
      }
    }
  };

  this.map = function(callback) {
    var result = [];
    this.forEach(function(entry, name) {
      result.push(callback(entry, name));
    });
    return result;
  };

  this.filter = function(callback) {
    var result = [];
    this.forEach(function(entry, name) {
      if (callback(entry, name)) {
        result.push(entry);
      }
    });
    return result;
  };

};

oo.initClass(Registry);

export default Registry;
