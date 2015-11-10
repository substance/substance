'use strict';

var _ = require('../util/helpers');
var oo = require('../util/oo');
var AbstractDocument = require('./AbstractDocument');
var NodeIndex = require('./data/NodeIndex');
var AnnotationIndex = require('./AnnotationIndex');
var AnchorIndex = require('./AnchorIndex');

var TransactionDocument = require('./TransactionDocument');

var PathEventProxy = require('./PathEventProxy');
var ClipboardImporter = require('./ClipboardImporter');
var ClipboardExporter = require('./ClipboardExporter');

var __id__ = 0;

/**
  Abstract class used for deriving a custom article implementation.
  
  @class
  @abstract
  @extends model/AbstractDocument
  @param {model/Schema} schema The document schema.
  @example

  ```js
  var Document = require('substance/model/Document');
  var Article = function(schema) {
    Document.call(schema);

    // We set up a container that holds references to
    // block nodes (in our example paragraphs)
    this.create({
      type: "container",
      id: "body",
      nodes: []
    });
  };

  OO.inherit(Article, Document);
  ```

  Substance documents are manipulated incrementally using operations.

  ```js
  var doc = new Article();
  ```

  When you want to update a document, you must wrap your changes in a transaction, to avoid inconsistent in-between states. The API is fairly easy. Let's create two paragraph nodes in one transaction.

  ```js
  doc.transaction(function(tx) {
    tx.create({
      id: 'p1',
      type: 'paragraph',
      content: 'Hi I am a Substance paragraph.'
    });
    tx.create({
      id: 'p2',
      type: 'paragraph',
      content: 'And I am the second pargraph'
    });
  });
  ```

  A Substance document works like an object store, you can create as many nodes as you wish and assign unique id's to them. In order to create a sequence of nodes, we have to `show` them on a container node.

  ```js
  doc.transaction(function(tx) {
    var body = tx.get('body');
    body.show('p1');
    body.show('p2');
  });
  ```

  Now let's make a **strong** annotation. In Substance annotations are stored separately from the text. Annotations are just regular nodes in the document. They refer to a certain range (`startOffset, endOffset`) in a text property (`path`).

  ```js
  doc.transaction(function(tx) {
    tx.create({
      id: 's1',
      type: 'strong',
      path: ['p1', 'content'],
      "startOffset": 10,
      "endOffset": 19
    });
  });
  ```
*/

function Document(schema) {
  AbstractDocument.call(this, schema);
  this.__id__ = __id__++;

  // all by type
  this.addIndex('type', NodeIndex.create({
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
      _.each(self.data.nodes, function(node) {
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

    @param {object} beforeState object which will be used as before start of transaction
    @param {object} eventData object which will be used as payload for the emitted change event
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

  this.getClipboardImporter = function() {
    return new ClipboardImporter({ schema: this.getSchema()});
  };

  this.getClipboardExporter = function() {
    return new ClipboardExporter();
  };

  this.getHighlights = function() {
    return this._highlights;
  };

  // Set higlights on a document
  this.setHighlights = function(highlights) {
    var oldHighlights = this._highlights;

    if (oldHighlights) {
      _.each(oldHighlights, function(nodeId) {
        var node = this.get(nodeId);
        // Node could in the meanwhile have been deleted
        if (node) {
          node.setHighlighted(false);
        }
      }, this);
    }

    _.each(highlights, function(nodeId) {
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
    _.each(documentChange.ops, function(op) {
      this.data.apply(op);
      this._updateContainers(op);
      this.emit('operation:applied', op);
    }, this);
  };

  this._notifyChangeListeners = function(documentChange, info) {
    info = info || {};
    this.emit('document:changed', documentChange, info, this);
  };

  this.updateEventProxies = function(documentChange, info) {
    _.each(this.eventProxies, function(proxy) {
      proxy.onDocumentChanged(documentChange, info, this);
    }, this);
  };
};

oo.inherit(Document, AbstractDocument);

module.exports = Document;
