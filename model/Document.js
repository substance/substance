'use strict';

var each = require('lodash/collection/each');
var AbstractDocument = require('./AbstractDocument');
var DocumentIndex = require('./DocumentIndex');
var AnnotationIndex = require('./AnnotationIndex');
var AnchorIndex = require('./AnchorIndex');

var TransactionDocument = require('./TransactionDocument');

var PathEventProxy = require('./PathEventProxy');

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
  AbstractDocument.call(this, schema);
  this.__id__ = __id__++;

  // all by type
  this.addIndex('type', DocumentIndex.create({
    property: "type"
  }));

  // special index for (property-scoped) annotations
  this.addIndex('annotations', new AnnotationIndex());

  // special index for (contaoiner-scoped) annotations
  this.addIndex('container-annotation-anchors', new AnchorIndex());

  this.done = [];
  this.undone = [];

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

  this.initialize();

  // the stage is a essentially a clone of this document
  // used to apply a sequence of document operations
  // without touching this document
  this.stage = new TransactionDocument(this);
  this.isTransacting = false;

  this.FORCE_TRANSACTIONS = false;

  // Note: using the general event queue (as opposed to calling updateEventProxies from within _notifyChangeListeners)
  // so that handler priorities are considered correctly
  this.connect(this, {
    'document:changed': this.updateEventProxies
  });
}

Document.Prototype = function() {

  this.isTransaction = function() {
    return false;
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

  this.documentDidLoad = function() {
    // HACK: need to reset the stage
    this.stage.reset();
    this.done = [];
    // do not allow non-transactional changes after that
    this.FORCE_TRANSACTIONS = true;
  };

  this.clear = function() {
    var self = this;
    this.transaction(function(tx) {
      each(self.data.nodes, function(node) {
        tx.delete(node.id);
      });
    });
    this.documentDidLoad();
  };

  this.getEventProxy = function(name) {
    return this.eventProxies[name];
  };

  // Document manipulation
  //

  /**
    Start a transaction to manipulate the document

    @param {object} [beforeState] object which will be used as before start of transaction
    @param {object} [eventData] object which will be used as payload for the emitted document:change event
    @param {function} transformation a function(tx) that performs actions on the transaction document tx

    @example

    ```js
    doc.transaction({ selection: sel }, {'event-hack': true}, function(tx, args) {
      tx.update(...);
      ...
      return {
        selection: newSelection
      };
    })
    ```
  */
  this.transaction = function(beforeState, eventData, transformation) {
    /* jshint unused: false */
    if (this.isTransacting) {
      throw new Error('Nested transactions are not supported.');
    }
    this.isTransacting = true;
    var change = this.stage._transaction.apply(this.stage, arguments);
    this.isTransacting = false;
    return change;
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
    Creates a new {@link model/DocumentNode}. Use this API on a {@link model/TransactionDocument} to ensure consistency.

    @param {Object} nodeData

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
    if (this.FORCE_TRANSACTIONS) {
      throw new Error('Use a transaction!');
    }
    if (this.isTransacting) {
      this.stage.create(nodeData);
    } else {
      if (this.stage) {
        this.stage.create(nodeData);
      }
      this._create(nodeData);
    }
    return this.data.get(nodeData.id);
  };

  /**
    Removes a node with given nodeId.

    @param {String} nodeId

    @example

    ```js
    doc.transaction(function(tx) {
      tx.delete('p1');
    });
    ```
  */
  this.delete = function(nodeId) {
    if (this.FORCE_TRANSACTIONS) {
      throw new Error('Use a transaction!');
    }
    if (this.isTransacting) {
      this.stage.delete(nodeId);
    } else {
      if (this.stage) {
        this.stage.delete(nodeId);
      }
      this._delete(nodeId);
    }
  };

  /**
    Set a node's property to a new value.

    @param {Array} path
    @param {String} value

    @example

    ```js
    doc.transaction(function(tx) {
      tx.set(['p1', 'content'], "Hello there! I'm a new paragraph.");
    });
    ```
  */
  this.set = function(path, value) {
    if (this.FORCE_TRANSACTIONS) {
      throw new Error('Use a transaction!');
    }
    if (this.isTransacting) {
      return this.stage.set(path, value);
    } else {
      if (this.stage) {
        this.stage.set(path, value);
      }
      return this._set(path, value);
    }
  };

  this.update = function(path, diff) {
    if (this.FORCE_TRANSACTIONS) {
      throw new Error('Use a transaction!');
    }
    if (this.isTransacting) {
      return this.stage.update(path, diff);
    } else {
      if (this.stage) {
        this.stage.update(path, diff);
      }
      return this._update(path, diff);
    }
  };

  this.undo = function() {
    var change = this.done.pop();
    if (change) {
      var inverted = change.invert();
      this._apply(inverted);
      this.undone.push(inverted);
      this._notifyChangeListeners(inverted, { 'replay': true });
    } else {
      console.error('No change can be undone.');
    }
  };

  this.redo = function() {
    var change = this.undone.pop();
    if (change) {
      var inverted = change.invert();
      this._apply(inverted);
      this.done.push(inverted);
      this._notifyChangeListeners(inverted, { 'replay': true });
    } else {
      console.error('No change can be redone.');
    }
  };

  this.getDocumentMeta = function() {
    return this.get('document');
  };

  this.getHighlights = function() {
    return this._highlights;
  };

  // Set higlights on a document
  this.setHighlights = function(highlights) {
    var oldHighlights = this._highlights;

    if (oldHighlights) {
      each(oldHighlights, function(nodeId) {
        var node = this.get(nodeId);
        // Node could in the meanwhile have been deleted
        if (node) {
          node.setHighlighted(false);
        }
      }, this);
    }

    each(highlights, function(nodeId) {
      var node = this.get(nodeId);
      node.setHighlighted(true);
    }, this);

    this._highlights = highlights;
    this.emit('highlights:updated', highlights);
  };

  /**
   * Enable or disable auto-attaching of nodes.
   * When this is enabled (default), a created node
   * gets attached to the document instantly.
   * Otherwise you need to take care of that yourself.
   *
   * Used internally e.g., by AbstractDocument.prototype.loadSeed()
   * @private
   */
  this._setAutoAttach = function(val) {
    Document.super.prototype._setAutoAttach.call(this, val);
    this.stage._setAutoAttach(val);
  };

  this._apply = function(documentChange, mode) {
    if (mode !== 'saveTransaction') {
      if (this.isTransacting) {
        throw new Error('Can not replay a document change during transaction.');
      }
      // in case of playback we apply the change to the
      // stage (i.e. transaction clone) to keep it updated on the fly
      this.stage.apply(documentChange);
    }
    each(documentChange.ops, function(op) {
      this.data.apply(op);
      this.emit('operation:applied', op);
    }, this);
  };

  this._notifyChangeListeners = function(documentChange, info) {
    info = info || {};
    this.emit('document:changed', documentChange, info, this);
  };

  this.updateEventProxies = function(documentChange, info) {
    each(this.eventProxies, function(proxy) {
      proxy.onDocumentChanged(documentChange, info, this);
    }, this);
  };
};

AbstractDocument.extend(Document);

module.exports = Document;
