'use strict';

var _ = require('../../util/helpers');
var oo = require('../../util/oo');
var PathAdapter = require('../../util/PathAdapter');
var EventEmitter = require('../../util/EventEmitter');

/*
 * A data storage implemention.
 *
 * @extends util/EventEmitter
 * @param {Schema} schema
 * @param {Object} [options]
 */
function Data(schema, options) {
  EventEmitter.call(this);

  this.schema = schema;
  this.nodes = new PathAdapter();
  this.indexes = {};
  // Handlers that are called after a node was created or deleted
  options = options || {};
  // For example in Substance.Document this is used to attach and detach a document from a node.
  this.didCreateNode = options.didCreateNode || function() {};
  this.didDeleteNode = options.didDeleteNode || function() {};

  // Sometimes necessary to resolve issues with updating indexes in presence
  // of cyclic dependencies
  this.__QUEUE_INDEXING__ = false;
  this.queue = [];
}

Data.Prototype = function() {

  /**
   * Get a node or value via path.
   *
   * @method get
   * @param {String|Array} path node id or path to property.
   * @return a Node instance, a value or undefined if not found.
   *
   * @memberof module:Data.Data.prototype
   */
  this.get = function(path) {
    if (!path) {
      throw new Error('Path or id required');
    }
    return this.nodes.get(path);
  };

  /**
   * Get the internal storage for nodes.
   *
   * @method getNodes
   * @return The internal node storage.
   *
   * @memberof module:Data.Data.prototype
   */
  this.getNodes = function() {
    return this.nodes;
  };

  /**
   * Create a node from the given data.
   *
   * @method create
   * @return {Node} The created node.
   *
   * @memberof module:Data.Data.prototype
   */
  this.create = function(nodeData) {
    var node = this.schema.getNodeFactory().create(nodeData.type, nodeData);
    if (!node) {
      throw new Error('Illegal argument: could not create node for data:', nodeData);
    }
    if (this.contains(node.id)) {
      throw new Error("Node already exists: " + node.id);
    }
    if (!node.id || !node.type) {
      throw new Error("Node id and type are mandatory.");
    }
    this.nodes[node.id] = node;
    this.didCreateNode(node);

    var change = {
      type: 'create',
      node: node
    };

    if (this.__QUEUE_INDEXING__) {
      this.queue.push(change);
    } else {
      this.updateIndexes(change);
    }

    return node;
  };

  /**
   * Delete the node with given id.
   *
   * @param {String} nodeId
   * @return {Node} The deleted node.
   */
  this.delete = function(nodeId) {
    var node = this.nodes[nodeId];
    delete this.nodes[nodeId];
    this.didDeleteNode(node);

    var change = {
      type: 'delete',
      node: node,
    };

    if (this.__QUEUE_INDEXING__) {
      this.queue.push(change);
    } else {
      this.updateIndexes(change);
    }

    return node;
  };

  /**
   * Set a property to a new value.
   *
   * @method set
   * @param {Array} property path
   * @param {Object} newValue
   * @return {Node} The deleted node.
   *
   * @memberof module:Data.Data.prototype
   */
  this.set = function(path, newValue) {
    var node = this.get(path[0]);
    var oldValue = this.nodes.get(path);
    this.nodes.set(path, newValue);

    var change = {
      type: 'set',
      node: node,
      path: path,
      newValue: newValue,
      oldValue: oldValue
    };

    if (this.__QUEUE_INDEXING__) {
      this.queue.push(change);
    } else {
      this.updateIndexes(change);
    }

    return oldValue;
  };

  /**
   * Update a property incrementally.
   *
   * @method update
   * @param {Array} property path
   * @param {Object} diff
   *
   * @memberof module:Data.Data.prototype
   */
  // TODO: do we really want this incremental implementation here?
  this.update = function(path, diff) {
    var oldValue = this.nodes.get(path);
    var newValue;
    if (diff.isOperation) {
      newValue = diff.apply(oldValue);
    } else {
      var start, end, pos, val;
      if (_.isString(oldValue)) {
        if (diff['delete']) {
          // { delete: [2, 5] }
          start = diff['delete'].start;
          end = diff['delete'].end;
          newValue = oldValue.split('').splice(start, end-start).join('');
        } else if (diff['insert']) {
          // { insert: [2, "foo"] }
          pos = diff['insert'].offset;
          val = diff['insert'].value;
          newValue = [oldValue.substring(0, pos), val, oldValue.substring(pos)].join('');
        } else {
          throw new Error('Diff is not supported:', JSON.stringify(diff));
        }
      } else if (_.isArray(oldValue)) {
        newValue = oldValue.slice(0);
        if (diff['delete']) {
          // { delete: 2 }
          pos = diff['delete'].offset;
          newValue.splice(pos, 1);
        } else if (diff['insert']) {
          // { insert: [2, "foo"] }
          pos = diff['insert'].offset;
          val = diff['insert'].value;
          newValue.splice(pos, 0, val);
        } else {
          throw new Error('Diff is not supported:', JSON.stringify(diff));
        }
      } else {
        throw new Error('Diff is not supported:', JSON.stringify(diff));
      }
    }
    this.nodes.set(path, newValue);
    var node = this.get(path[0]);

    var change = {
      type: 'update',
      node: node,
      path: path,
      newValue: newValue,
      oldValue: oldValue
    };

    if (this.__QUEUE_INDEXING__) {
      this.queue.push(change);
    } else {
      this.updateIndexes(change);
    }

    return oldValue;
  };

  /**
   * Convert to JSON.
   *
   * @method toJSON
   * @return {Object} Plain content.
   *
   * @memberof module:Data.Data.prototype
   */
  this.toJSON = function() {
    return {
      schema: [this.schema.id, this.schema.version],
      nodes: _.deepclone(this.nodes)
    };
  };

  /**
   * Check if this storage contains a node with given id.
   *
   * @method contains
   * @return {Boolean} `true` if a node with id exists, `false` otherwise.
   *
   * @memberof module:Data.Data.prototype
   */
  this.contains = function(id) {
    return (!!this.nodes[id]);
  };

  /**
   * Clear nodes.
   *
   * @method reset
   *
   * @memberof module:Data.Data.prototype
   */
  this.reset = function() {
    this.nodes = new PathAdapter();
  };

  /**
   * Add a node index.
   *
   * @method addIndex
   * @param {String} name
   * @param {NodeIndex} index
   *
   * @memberof module:Data.Data.prototype
   */
  this.addIndex = function(name, index) {
    if (this.indexes[name]) {
      console.error('Index with name %s already exists.', name);
    }
    index.reset(this);
    this.indexes[name] = index;
    return index;
  };

  /**
   * Get the node index with given name.
   *
   * @method getIndex
   * @param {String} name
   * @return The node index.
   *
   * @memberof module:Data.Data.prototype
   */
  this.getIndex = function(name) {
    return this.indexes[name];
  };

  this.updateIndexes = function(change) {
    if (!change || this.__QUEUE_INDEXING__) return;
    _.each(this.indexes, function(index) {
      if (index.select(change.node)) {
        if (!index[change.type]) {
          console.error('Contract: every NodeIndex must implement ' + change.type);
        }
        index[change.type](change.node, change.path, change.newValue, change.oldValue);
      }
    });
  };

  this.stopIndexing = function() {
    this.__QUEUE_INDEXING__ = true;
  };

  this.startIndexing = function() {
    this.__QUEUE_INDEXING__ = false;
    while(this.queue.length >0) {
      var change = this.queue.shift();
      this.updateIndexes(change);
    }
  };

};

oo.inherit(Data, EventEmitter);

module.exports = Data;
