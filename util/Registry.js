import forEach from './forEach'

// just as a reference to detect name collisions
// with native Object properties
const PLAINOBJ = {}

/*
 * Simple registry implementation.
 *
 * @class Registry
 * @private
 */
class Registry {
  constructor(entries, validator) {
    this.entries = {}
    this.names = []
    this.validator = validator

    if (entries) {
      forEach(entries, function(entry, name) {
        this.add(name, entry)
      }.bind(this))
    }
  }

  get _isRegistry() { return true }

  /**
   * Check if an entry is registered for a given name.
   *
   * @param {String} name
   * @method contains
   * @memberof module:Basics.Registry.prototype
   */
  contains(name) {
    return this.entries.hasOwnProperty(name)
  }

  /**
   * Add an entry to the registry.
   *
   * @param {String} name
   * @param {Object} entry
   * @method add
   * @memberof module:Basics.Registry.prototype
   */
  add(name, entry) {
    if (this.validator) {
      this.validator(entry)
    }
    if (PLAINOBJ[name]) {
      throw new Error('Illegal key: "'+name+'" is a property of Object which is thus not allowed as a key.')
    }
    if (this.contains(name)) {
      this.remove(name)
    }
    this.entries[name] = entry
    this.names.push(name)
  }

  /**
   * Remove an entry from the registry.
   *
   * @param {String} name
   * @method remove
   * @memberof module:Basics.Registry.prototype
   */
  remove(name) {
    let pos = this.names.indexOf(name)
    if (pos >= 0) {
      this.names.splice(pos, 1)
    }
    delete this.entries[name]
  }

  /**
   * @method clear
   * @memberof module:Basics.Registry.prototype
   */
  clear() {
    this.names = []
    this.entries = {}
  }

  /**
   * Get the entry registered for a given name.
   *
   * @param {String} name
   * @return The registered entry
   * @method get
   * @memberof module:Basics.Registry.prototype
   */
  get(name) {
    return this.entries[name]
  }

  /*
   * Iterate all registered entries in the order they were registered.
   *
   * @param {Function} callback with signature function(entry, name)
   * @param {Object} execution context
   */
  each(callback, ctx) {
    console.warn('DEPRECATED: use Registry.forEach(cb) instead')
    return this.forEach(callback.bind(ctx))
  }

  forEach(callback) {
    for (let i = 0; i < this.names.length; i++) {
      let name = this.names[i]
      let _continue = callback(this.entries[name], name)
      if (_continue === false) {
        break
      }
    }
  }

  map(callback) {
    let result = []
    this.forEach(function(entry, name) {
      result.push(callback(entry, name))
    })
    return result
  }

  filter(callback) {
    let result = []
    this.forEach(function(entry, name) {
      if (callback(entry, name)) {
        result.push(entry)
      }
    })
    return result
  }
}

export default Registry