'use strict';

var _ = require('../util/helpers');
var EventEmitter = require('../util/EventEmitter');
var oo = require('../util/oo');
var IncrementalData = require('./data/IncrementalData');
var NodeFactory = require('./data/NodeFactory');
var Selection = require('./Selection');
var PropertySelection = require('./PropertySelection');
var ContainerSelection = require('./ContainerSelection');
var TableSelection = require('./TableSelection');
var docHelpers = require('./documentHelpers');

/*
 * Abstract Document implementation.
 *
 * @class
 * @abstract
 */
function AbstractDocument(schema) {
  EventEmitter.call(this);

  /**
   * The schema.
   * @type {model/DocumentSchema}
   */
  this.schema = schema;

  this.AUTO_ATTACH = true;
  this.FOR_CLIPBOARD = false;

  this.data = new IncrementalData(schema, {
    nodeFactory: new AbstractDocument.NodeFactory(this)
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

  this.documentDidLoad = function() {};

  this.getSchema = function() {
    return this.schema;
  };

  /**
   * @see model/data/Data#get
   * @skip
   */
  this.get = function(path) {
    return this.data.get(path);
  };

  /**
   * @see model/data/Data#getNodes
   * @skip
   */
  this.getNodes = function() {
    return this.data.getNodes();
  };

  /**
   * @see model/data/Data#addIndex
   * @skip
   */
  this.addIndex = function(name, index) {
    return this.data.addIndex(name, index);
  };

  /**
   * @see model/data/Data#getIndex
   * @skip
   */
  this.getIndex = function(name) {
    return this.data.getIndex(name);
  };

  /**
   * @deprecated We will drop support as this should be done in a more
   *             controlled fashion using an importer.
   * @skip
   */
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

  /**
   * @see model/docHelpers.getTextForSelection
   * @skip
   */
  this.getTextForSelection = function(sel) {
    return docHelpers.getTextForSelection(this, sel);
  };

  /**
   * @depricated We should use a dedicated exported instead.
   * @skip
   */
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

  /**
   * Sets the text of a property together with annotations.
   *
   * @param {String[]} path Path to the text property.
   */
  this.setText = function(path, text, annotations) {
    // TODO: this should not be here, if really necessary it should go into
    // document helpers.
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
    Creates a selection which is attached to this document.
    Every selection implementation provides its own
    parameter format which is basically a JSON representation.

    @param {model/Selection} sel An object describing the selection.

    @example

    ```js
    doc.createSelection({
      type: 'property',
      path: [ 'text1', 'content'],
      startOffset: 10,
      endOffset: 20
    })
    ```
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

  this._setForClipboard = function(val) {
    this.FOR_CLIPBOARD = val;
  };

  this._resetContainers = function() {
    var containers = this.getIndex('type').get('container');
    // reset containers initially
    _.each(containers, function(container) {
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

  this._updateContainers = function(op) {
    var containers = this.getIndex('type').get('container');
    _.each(containers, function(container) {
      container.update(op);
    });
  };
};

oo.inherit(AbstractDocument, EventEmitter);

AbstractDocument.NodeFactory = function(doc) {
  NodeFactory.call(this);
  this.doc = doc;
  doc.schema.each(function(NodeClass) {
    this.register(NodeClass);
  }.bind(this));
};

module.exports = AbstractDocument;
