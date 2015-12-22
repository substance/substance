'use strict';

var each = require('lodash/collection/each');
var EventEmitter = require('../util/EventEmitter');
var IncrementalData = require('./data/IncrementalData');
var DocumentNodeFactory = require('./DocumentNodeFactory');
var Selection = require('./Selection');
var PropertySelection = require('./PropertySelection');
var ContainerSelection = require('./ContainerSelection');
var TableSelection = require('./TableSelection');
var docHelpers = require('./documentHelpers');

/**
  Abstract Document implementation.

  @class
  @abstract
 */
function AbstractDocument(schema) {
  EventEmitter.call(this);

  this.schema = schema;

  this.AUTO_ATTACH = true;

  this.nodeFactory = new DocumentNodeFactory(this);

  this.data = new IncrementalData(schema, {
    nodeFactory: this.nodeFactory
  });
}

EventEmitter.extend(AbstractDocument, function AbstractDocumentPrototype() {

  this.isTransaction = function() {
    return false;
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

  /**
    @returns {model/DocumentSchema} the document's schema.
  */
  this.getSchema = function() {
    return this.schema;
  };

  /**
    Check if this storage contains a node with given id.

    @returns {Boolean} `true` if a node with id exists, `false` otherwise.
  */
  this.contains = function(id) {
    this.data.contains(id);
  };

  /**
    Get a node or value via path.

    @param {String|String[]} path node id or path to property.
    @returns {DocumentNode|any|undefined} a Node instance, a value or undefined if not found.
  */
  this.get = function(path) {
    return this.data.get(path);
  };

  /**
    @return {Object} A hash of {@link model/DocumentNode} instances.
  */
  this.getNodes = function() {
    return this.data.getNodes();
  };

  /**
    Create a node from the given data.

    @param {Object} plain node data.
    @return {DocumentNode} The created node.

    @example

    ```js
    doc.transaction(function(tx) {
      tx.create({
        id: 'p1',
        type: 'paragraph',
        content: 'Hi I am a Substance paragraph.'
      });
    });
    ```
  */
  this.create = function(nodeData) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };


  /**
    Delete the node with given id.

    @param {String} nodeId
    @returns {DocumentNode} The deleted node.

    @example

    ```js
    doc.transaction(function(tx) {
      tx.delete('p1');
    });
    ```
  */
  this.delete = function(nodeId) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };

  /**
    Set a property to a new value.

    @param {String[]} property path
    @param {any} newValue
    @returns {DocumentNode} The deleted node.

    @example

    ```js
    doc.transaction(function(tx) {
      tx.set(['p1', 'content'], "Hello there! I'm a new paragraph.");
    });
    ```
  */
  this.set = function(path, value) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };

  /**
    Update a property incrementally.

    DEPRECATED: this will be replaced with a more intuitive API soon.

    @param {Array} property path
    @param {Object} diff
    @returns {any} The value before applying the update.

    @deprecated

    @example

    Updating a string property:

    ```
    doc.update(['p1', 'content'], { delete: {start: 0, end: 3} });
    ```
    would turn "Foobar" into "bar".

    ```
    doc.update(['p1', 'content'], { insert: {offset: 3, value: "fee"} });
    ```
    would turn "Foobar" into "Foofeebar".

    ```
    doc.update(['body', 'nodes'], { delete: 2 });
    ```
    would turn `[1,2,3,4]` into `[1,2,4]`.

    ```
    doc.update(['p1', 'content'], { insert: {offset: 2, value: 0} });
    ```
    would turn `[1,2,3,4]` into `[1,2,0,3,4]`.
  */
  this.update = function(path, diff) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };

  /**
    Add a document index.

    @param {String} name
    @param {DocumentIndex} index
  */
  this.addIndex = function(name, index) {
    return this.data.addIndex(name, index);
  };

  /**
    @param {String} name
    @returns {DocumentIndex} the node index with given name.
  */
  this.getIndex = function(name) {
    return this.data.getIndex(name);
  };

  /**
    Creates a selection which is attached to this document.
    Every selection implementation provides its own
    parameter format which is basically a JSON representation.

    @param {model/Selection} sel An object describing the selection.

    @example

    Creating a PropertySelection:

    ```js
    doc.createSelection({
      type: 'property',
      path: [ 'text1', 'content'],
      startOffset: 10,
      endOffset: 20
    })
    ```

    Creating a ContainerSelection:

    ```js
    doc.createSelection({
      type: 'container',
      containerId: 'main',
      startPath: [ 'p1', 'content'],
      startOffset: 10,
      startPath: [ 'p2', 'content'],
      endOffset: 20
    })
    ```

    Creating a NullSelection:

    ```js
    doc.createSelection(null);
    ```
  */
  this.createSelection = function(sel) {
    /*
     TODO: maybe we want a simpler DSL in addition to the JSON spec?
      ```
      doc.createSelection(null);
      doc.createSelection(['p1','content'], 0, 5);
        -> PropertySelection
      doc.createSelection(['p1','content'], 0, ['p2', 'content'], 5);
        -> ContainerSelection
      ```
    */
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

  /**
   * DEPRECATED: We will drop support as this should be done in a more
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
    each(this.data.nodes, function(node) {
      this.delete(node.id);
    }, this);
    // 2. create nodes with AUTO_ATTACH disabled
    // this._setAutoAttach(false);
    each(seed.nodes, function(nodeData) {
      this.create(nodeData);
    }, this);

    this.documentDidLoad();
  };

  /**
    Convert to JSON.

    DEPRECATED: We moved away from having JSON as first-class exchange format.
    We will remove this soon.

    @private
    @returns {Object} Plain content.
    @deprecated
  */
  this.toJSON = function() {
    // TODO: deprecate this
    // console.warn('DEPRECATED: Document.toJSON(). Use model/JSONConverter instead.');
    var nodes = {};
    each(this.getNodes(), function(node) {
      nodes[node.id] = node.toJSON();
    });
    return {
      schema: [this.schema.name, this.schema.version],
      nodes: nodes
    };
  };

  this.getTextForSelection = function(sel) {
    console.warn('DEPRECATED: use docHelpers.getTextForSelection() instead.');
    return docHelpers.getTextForSelection(this, sel);
  };

  this.setText = function(path, text, annotations) {
    // TODO: this should go into document helpers.
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

  this._create = function(nodeData) {
    var op = this.data.create(nodeData);
    return op;
  };

  this._delete = function(nodeId) {
    var op = this.data.delete(nodeId);
    return op;
  };

  this._update = function(path, diff) {
    var op = this.data.update(path, diff);
    return op;
  };

  this._set = function(path, value) {
    var op = this.data.set(path, value);
    return op;
  };
});

module.exports = AbstractDocument;
