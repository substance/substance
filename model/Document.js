'use strict';

var each = require('lodash/each');
var DocumentIndex = require('./DocumentIndex');
var AnnotationIndex = require('./AnnotationIndex');
var AnchorIndex = require('./AnchorIndex');
var DocumentChange = require('./DocumentChange');
var PathEventProxy = require('./PathEventProxy');
var EventEmitter = require('../util/EventEmitter');
var IncrementalData = require('./data/IncrementalData');
var DocumentNodeFactory = require('./DocumentNodeFactory');
var Selection = require('./Selection');
var PropertySelection = require('./PropertySelection');
var ContainerSelection = require('./ContainerSelection');
var TableSelection = require('./TableSelection');
var docHelpers = require('./documentHelpers');

var __id__ = 0;

/**
  Abstract class used for deriving a custom article implementation.
  Requires a {@link model/DocumentSchema} to be provided on construction.

  @class Document
  @abstract
  @extends model/AbstractDocument
  @example

  ```js
  var Document = require('substance/model/Document');
  var articleSchema = require('./myArticleSchema');
  var Article = function() {
    Article.super.call(articleSchema);

    // We set up a container that holds references to
    // block nodes (e.g. paragraphs and figures)
    this.create({
      type: "container",
      id: "body",
      nodes: []
    });
  };

  Document.extend(Article);
  ```
*/

/**
  @constructor Document
  @param {DocumentSchema} schema The document schema.
*/

function Document(schema) {
  Document.super.apply(this);

  this.__id__ = __id__++;
  this.schema = schema;
  this.nodeFactory = new DocumentNodeFactory(this);
  this.data = new IncrementalData(schema, {
    nodeFactory: this.nodeFactory
  });

  // all by type
  this.addIndex('type', DocumentIndex.create({
    property: "type"
  }));

  // special index for (property-scoped) annotations
  this.addIndex('annotations', new AnnotationIndex());

  // special index for (contaoiner-scoped) annotations
  this.addIndex('container-annotation-anchors', new AnchorIndex());

  // change event proxies are triggered after a document change has been applied
  // before the regular document:changed event is fired.
  // They serve the purpose of making the event notification more efficient
  // In earlier days all observers such as node views where listening on the same event 'operation:applied'.
  // This did not scale with increasing number of nodes, as on every operation all listeners where notified.
  // The proxies filter the document change by interest and then only notify a small set of observers.
  // Example: NotifyByPath notifies only observers which are interested in changes to a certain path.
  this.eventProxies = {
    'path': new PathEventProxy(this),
  };

  // Note: using the general event queue (as opposed to calling _updateEventProxies from within _notifyChangeListeners)
  // so that handler priorities are considered correctly
  this.connect(this, {
    'document:changed': this._updateEventProxies
  });
}

Document.Prototype = function() {

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
    Creates a context like a transaction for importing nodes.
    This is important in presence of cyclic dependencies.
    Indexes will not be updated during the import but will afterwards
    when all nodes are have been created.

    @private
    @param {Function} importer a `function(doc)`, where with `doc` is a `model/AbstractDocument`

    @example

    Consider the following example from our documentation generator:
    We want to have a member index, which keeps track of members of namespaces, modules, and classes.
    grouped by type, and in the case of classes, also grouped by 'instance' and 'class'.

    ```
    ui
      - class
        - ui/Component
    ui/Component
      - class
        - method
          - mount
      - instance
        - method
          - render
    ```

    To decide which grouping to apply, the parent type of a member needs to be considered.
    Using an incremental approach, this leads to the problem, that the parent must exist
    before the child. At the same time, e.g. when deserializing, the parent has already
    a field with all children ids. This cyclic dependency is best address, by turning
    off all listeners (such as indexes) until the data is consistent.

  */
  this.import = function(importer) {
    try {
      this.data._stopIndexing();
      importer(this);
      this.data._startIndexing();
    } finally {
      this.data.queue = [];
      this.data._startIndexing();
    }
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
    var op = this._create(nodeData);
    this._notifyChangeListeners(new DocumentChange([op], {}, {}));
    return this.data.get(nodeData.id);
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
    var node = this.get(nodeId);
    var op = this._delete(nodeId);
    this._notifyChangeListeners(new DocumentChange([op], {}, {}));
    return node;
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
    var oldValue = this.get(path);
    var op = this._set(path, value);
    this._notifyChangeListeners(new DocumentChange([op], {}, {}));
    return oldValue;
  };

  /**
    Update a property incrementally.

    @param {Array} property path
    @param {Object} diff
    @returns {any} The value before applying the update.

    @example


    Inserting text into a string property:
    ```
    doc.update(['p1', 'content'], { insert: {offset: 3, value: "fee"} });
    ```
    would turn "Foobar" into "Foofeebar".

    Deleting text from a string property:
    ```
    doc.update(['p1', 'content'], { delete: {start: 0, end: 3} });
    ```
    would turn "Foobar" into "bar".

    Inserting into an array:
    ```
    doc.update(['p1', 'content'], { insert: {offset: 2, value: 0} });
    ```
    would turn `[1,2,3,4]` into `[1,2,0,3,4]`.

    Deleting from an array:
    ```
    doc.update(['body', 'nodes'], { delete: 2 });
    ```
    would turn `[1,2,3,4]` into `[1,2,4]`.
  */
  this.update = function(path, diff) {
    var op = this._update(path, diff);
    this._notifyChangeListeners(new DocumentChange([op], {}, {}));
    return op;
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

  this.getEventProxy = function(name) {
    return this.eventProxies[name];
  };

  this.newInstance = function() {
    var DocumentClass = this.constructor;
    return new DocumentClass(this.schema);
  };

  this.fromSnapshot = function(data) {
    var doc = this.newInstance();
    doc.loadSeed(data);
    return doc;
  };

  this.getDocumentMeta = function() {
    return this.get('document');
  };

  this._apply = function(documentChange) {
    each(documentChange.ops, function(op) {
      this.data.apply(op);
      this.emit('operation:applied', op);
    }.bind(this));
    // extract aggregated information, such as which property has been affected etc.
    documentChange._extractInformation(this);
  };

  this._notifyChangeListeners = function(change, info) {
    info = info || {};
    this.emit('document:changed', change, info, this);
  };

  this._updateEventProxies = function(change, info) {
    each(this.eventProxies, function(proxy) {
      proxy.onDocumentChanged(change, info, this);
    }.bind(this));
  };

  /**
   * DEPRECATED: We will drop support as this should be done in a more
   *             controlled fashion using an importer.
   * @skip
   */
  this.loadSeed = function(seed) {
    // clear all existing nodes (as they should be there in the seed)
    each(this.data.nodes, function(node) {
      this.delete(node.id);
    }.bind(this));
    // create nodes
    each(seed.nodes, function(nodeData) {
      this.create(nodeData);
    }.bind(this));

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

};

EventEmitter.extend(Document);

module.exports = Document;
