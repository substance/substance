'use strict';

var _ = require('../../util/helpers');
var oo = require('../../util/oo');
var PathAdapter = require('../../util/PathAdapter');

/**
 * Index for Nodes.
 *
 * Node indexes are first-class citizens in Substance.Data.
 * I.e., they are updated after each operation.
 *
 * @class NodeIndex
 *
 * @memberof module:Data
 */
var NodeIndex = function() {
  /**
   * Internal storage.
   *
   * @property {PathAdapter} index
   * @private
   *
   * @instance module:Data.NodeIndex
   */
  this.index = new PathAdapter();
};

NodeIndex.Prototype = function() {

  /**
   * Reset the index using a Data instance.
   *
   * @method reset
   * @private
   *
   * @memberof module:Data.NodeIndex.prototype
   */
  this.reset = function(data) {
    this.index.clear();
    this._initialize(data);
  };

  this._initialize = function(data) {
    _.each(data.getNodes(), function(node) {
      if (this.select(node)) {
        this.create(node);
      }
    }, this);
  };

  /**
   * The property used for indexing.
   *
   * @property {String} property
   * @protected
   *
   * @memberof module:Data.NodeIndex.prototype
   */
  this.property = "id";

  /**
   * Check if a node should be indexed.
   *
   * Used internally only. Override this in subclasses to achieve a custom behavior.
   *
   * @method select
   * @protected
   *
   * @memberof module:Data.NodeIndex.prototype
   */
  this.select = function(node) {
    if(!this.type) {
      return true;
    } else {
      return node.isInstanceOf(this.type);
    }
  };

  /**
   * Get all indexed nodes for a given path.
   *
   * @method get
   * @param {Array} path
   * @return A node or an object with ids and nodes as values.
   *
   * @memberof module:Data.NodeIndex.prototype
   */
  // TODO: what is the correct return value. We have arrays at some places.
  this.get = function(path) {
    // HACK: unwrap objects on the index when method is called without a path
    if (!path) return this.getAll();
    return this.index.get(path) || {};
  };

  /**
   * Collects all indexed nodes.
   *
   * @method getAll
   * @return An object with ids as keys and nodes as values.
   *
   * @memberof module:Data.NodeIndex.prototype
   */
  // TODO: is that true?
  this.getAll = function() {
    var result = {};
    _.each(this.index, function(values) {
      _.extend(result, values);
    });
    return result;
  };

  /**
   * Called when a node has been created.
   *
   * Override this in subclasses for customization.
   *
   * @method create
   * @param {Node} node
   * @protected
   *
   * @memberof module:Data.NodeIndex.prototype
   */
  this.create = function(node) {
    var values = node[this.property];
    if (!_.isArray(values)) {
      values = [values];
    }
    _.each(values, function(value) {
      this.index.set([value, node.id], node);
    }, this);
  };

  /**
   * Called when a node has been deleted.
   *
   * Override this in subclasses for customization.
   *
   * @method delete
   * @param {Node} node
   * @protected
   *
   * @memberof module:Data.NodeIndex.prototype
   */
  this.delete = function(node) {
    var values = node[this.property];
    if (!_.isArray(values)) {
      values = [values];
    }
    _.each(values, function(value) {
      this.index.delete([value, node.id]);
    }, this);
  };

  /**
   * Called when a property has been updated.
   *
   * Override this in subclasses for customization.
   *
   * @method update
   * @param {Node} node
   * @protected
   *
   * @memberof module:Data.NodeIndex.prototype
   */
  this.update = function(node, path, newValue, oldValue) {
    if (!this.select(node) || path[1] !== this.property) return;
    var values = oldValue;
    if (!_.isArray(values)) {
      values = [values];
    }
    _.each(values, function(value) {
      this.index.delete([value, node.id]);
    }, this);
    values = newValue;
    if (!_.isArray(values)) {
      values = [values];
    }
    _.each(values, function(value) {
      this.index.set([value, node.id], node);
    }, this);
  };

  /**
   * Clone this index.
   *
   * @method clone
   * @return A cloned NodeIndex.
   *
   * @memberof module:Data.NodeIndex.prototype
   */
  this.clone = function() {
    var NodeIndexClass = this.constructor;
    var clone = new NodeIndexClass();
    return clone;
  };
};

oo.initClass( NodeIndex );

/**
 * Create a new NodeIndex using the given prototype as mixin.
 *
 * @method create
 * @param {Object} prototype
 * @static
 * @return A customized NodeIndex.
 *
 * @memberof module:Data.NodeIndex
 */
NodeIndex.create = function(prototype) {
  var index = _.extend(new NodeIndex(), prototype);
  index.clone = function() {
    return NodeIndex.create(prototype);
  };
  return index;
};

module.exports = NodeIndex;
