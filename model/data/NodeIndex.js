'use strict';

var _ = require('../../util/helpers');
var oo = require('../../util/oo');
var PathAdapter = require('../../util/PathAdapter');

/*
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
   * Get all indexed nodes for a given path.
   *
   * @param {Array} path
   * @returns A node or an object with ids and nodes as values.
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
   * @returns An object with ids as keys and nodes as values.
   */
  this.getAll = function() {
    var result = {};
    _.each(this.index, function(values) {
      _.extend(result, values);
    });
    return result;
  };

  /**
   * The property used for indexing.
   *
   * @private
   * @type {String}
   */
  this.property = "id";

  /**
   * Check if a node should be indexed.
   *
   * Used internally only. Override this in subclasses to achieve a custom behavior.
   *
   * @private
   * @param {model/data/Node}
   * @returns {Boolean} true if the given node should be added to the index.
   */
  this.select = function(node) {
    if(!this.type) {
      return true;
    } else {
      return node.isInstanceOf(this.type);
    }
  };

  /**
   * Called when a node has been created.
   *
   * Override this in subclasses for customization.
   *
   * @private
   * @param {Node} node
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
   * @private
   * @param {Node} node
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
   * @private
   * @param {Node} node
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

  this.set = function(node, path, newValue, oldValue) {
    this.update(node, path, newValue, oldValue);
  };

  /**
   * Reset the index using a Data instance.
   *
   * @private
   */
  this.reset = function(data) {
    this.index.clear();
    this._initialize(data);
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

  this._initialize = function(data) {
    _.each(data.getNodes(), function(node) {
      if (this.select(node)) {
        this.create(node);
      }
    }, this);
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
