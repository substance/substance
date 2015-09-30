'use strict';

var _ = require('../basics/helpers');
var Substance = require('../basics');
var Data = require('../data');
var Selection = require('./selection');
var PropertySelection = require('./property_selection');
var ContainerSelection = require('./container_selection');
var TableSelection = require('./table_selection');
var docHelpers = require('./helpers');

function AbstractDocument(schema) {
  Substance.EventEmitter.call(this);
  this.schema = schema;

  this.AUTO_ATTACH = true;
  this.FOR_CLIPBOARD = false;

  this.data = new Data.Incremental(schema, {
    didCreateNode: _.bind(this._didCreateNode, this),
    didDeleteNode: _.bind(this._didDeleteNode, this),
  });
}

AbstractDocument.Prototype = function() {

  this.isTransaction = function() {
    return false;
  };

  this.isClipboard = function() {
    return this.FOR_CLIPBOARD;
  };

  this.newInstance = function() {
    throw new Error('Must be implemented in subclass.');
  };

  this.initialize = function() {
    // add things to the document, such as containers etc.
  };

  this.addIndex = function(name, index) {
    return this.data.addIndex(name, index);
  };

  this.getIndex = function(name) {
    return this.data.getIndex(name);
  };

  this.getNodes = function() {
    return this.data.nodes;
  };

  /**
   * Enable or disable auto-attaching of nodes.
   * When this is enabled (default), a created node
   * gets attached to the document instantly.
   * Otherwise you need to take care of that yourself.
   *
   * Used internally e.g., by AbstractDocument.prototype.loadSeed()
   */
  this._setAutoAttach = function(val) {
    this.AUTO_ATTACH = val;
  };

  this._setForClipboard = function(val) {
    this.FOR_CLIPBOARD = val;
  };

  this._resetContainers = function() {
    var containers = this.getIndex('type').get('container');
    // reset containers initially
    Substance.each(containers, function(container) {
      container.reset();
    });
  };

  this._create = function(nodeData) {
    var op = this.data.create(nodeData);
    this._updateContainers(op);
    return op;
  };

  this._delete = function(nodeId) {
    var op = this.data.delete(nodeId);
    this._updateContainers(op);
    return op;
  };

  this._update = function(path, diff) {
    var op = this.data.update(path, diff);
    this._updateContainers(op);
    return op;
  };

  this._set = function(path, value) {
    var op = this.data.set(path, value);
    this._updateContainers(op);
    return op;
  };

  this.documentDidLoad = function() {};

  this.getSchema = function() {
    return this.schema;
  };

  this.get = function(path) {
    return this.data.get(path);
  };

  this.getNodes = function() {
    return this.data.getNodes();
  };

  this.addIndex = function(name, index) {
    return this.data.addIndex(name, index);
  };

  this.getIndex = function(name) {
    return this.data.getIndex(name);
  };

  this.loadSeed = function(seed) {
    // Attention: order of nodes may be 'invalid'
    // so that we should not attach the doc a created note
    // until all its dependencies are created
    //
    // Thus we disable AUTO_ATTACH when creating nodes

    // 1. clear all existing nodes (as they should be there in the seed)
    _.each(this.data.nodes, function(node) {
      this.delete(node.id);
    }, this);
    // 2. create nodes with AUTO_ATTACH disabled
    this._setAutoAttach(false);
    _.each(seed.nodes, function(nodeData) {
      this.create(nodeData);
    }, this);
    this._setAutoAttach(true);
    // 3. attach all nodes
    _.each(this.data.nodes, function(node) {
      node.attach(this);
    }, this);

    this.documentDidLoad();
  };

  this.getTextForSelection = function(sel) {
    return docHelpers.getTextForSelection(this, sel);
  };

  this.toJSON = function() {
    var nodes = {};
    _.each(this.getNodes(), function(node) {
      nodes[node.id] = node.toJSON();
    });
    return {
      schema: [this.schema.name, this.schema.version],
      nodes: nodes
    };
  };

  this.create = function(nodeData) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };

  this.delete = function(nodeId) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };

  this.set = function(path, value) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };

  this.update = function(path, diff) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };

  this.setText = function(path, text, annotations) {
    var idx;
    var oldAnnos = this.getIndex('annotations').get(path);
    // TODO: what to do with container annotations
    for (idx = 0; idx < oldAnnos.length; idx++) {
      this.delete(oldAnnos[idx].id);
    }
    this.set(path, text);
    for (idx = 0; idx < annotations.length; idx++) {
      this.create(annotations[idx]);
    }
  };

  /**
   * Creates a selection which is attached to this document.
   * Every selection implementation provides its own
   * parameter format which is basically a JSON representation.
   *
   * @param an object describing the selection.
   * @example
   *   doc.createSelection({
   *     type: 'property',
   *     path: [ 'text1', 'content'],
   *     startOffset: 10,
   *     endOffset: 20
   *   })
   */
  this.createSelection = function(sel) {
    if (!sel) {
      return Selection.nullSelection;
    }
    switch(sel.type) {
      case 'property':
        return new PropertySelection(sel).attach(this);
      case 'container':
        return new ContainerSelection(sel).attach(this);
      case 'table':
        return new TableSelection(sel).attach(this);
      default:
        throw new Error('Unsupported selection type', sel.type);
    }
  };

  // Called back by Substance.Data after a node instance has been created
  this._didCreateNode = function(node) {
    if (this.AUTO_ATTACH) {
      // create the node from schema
      node.attach(this);
    }
  };

  this._didDeleteNode = function(node) {
    // create the node from schema
    node.detach(this);
  };

  this._updateContainers = function(op) {
    var containers = this.getIndex('type').get('container');
    _.each(containers, function(container) {
      container.update(op);
    });
  };
};

Substance.inherit(AbstractDocument, Substance.EventEmitter);

module.exports = AbstractDocument;
