'use strict';

var _ = require('../util/helpers');
var oo = require('../util/oo');
var AbstractDocument = require('./AbstractDocument');
var NodeIndex = require('./data/NodeIndex');
var AnnotationIndex = require('./AnnotationIndex');
var AnchorIndex = require('./AnchorIndex');

var TransactionDocument = require('./TransactionDocument');
var DocumentChange = require('./DocumentChange');

var PathEventProxy = require('./PathEventProxy');
var ClipboardImporter = require('./ClipboardImporter');
var ClipboardExporter = require('./ClipboardExporter');

var __id__ = 0;

/**
 * Represents a Substance Document. This is an abstract class that your custom
 * Article implementation can inherit from.
 *
 * @class
 * @extends model/AbstractDocument
 * @param {model/Schema} schema The document schema.
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

    @param beforeState object which will be used as before start of transaction
    @param eventData object which will be used as payload for the emitted change event
    @param transformation a function(tx) that performs actions on the transaction document tx
    @memberof module:model.Document.prototype

    @example

    doc.transaction({ selection: sel }, {'event-hack': true}, function(tx, args) {
      tx.update(...);
      ...
      return {
        selection: newSelection
      };
    })
  */
  this.transaction = function(beforeState, eventData, transformation) {
    if (arguments.length === 1) {
      transformation = arguments[0];
      eventData = {};
      beforeState = {};
    }
    if (arguments.length === 2) {
      transformation = arguments[1];
      eventData = {};
    } else {
      eventData = eventData || {};
    }

    if (!_.isFunction(transformation)) {
      throw new Error('Document.transaction() requires a transformation function.');
    }

    // var time = Date.now();
    // HACK: ATM we can't deep clone as we do not have a deserialization
    // for selections.
    var tx = this.startTransaction(_.clone(beforeState));
    // console.log('Starting the transaction took', Date.now() - time);
    try {
      // time = Date.now();
      var result = transformation(tx, beforeState);
      // being robust to transformation not returning a result
      if (!result) result = {};
      // console.log('Executing the transformation took', Date.now() - time);
      var afterState = {};
      // only keys that are in the beforeState can be in the afterState
      // TODO: maybe this is to sharp?
      // we could also just merge the transformation result with beforeState
      // but then we might have non-state related information in the after state.
      for (var key in beforeState) {
        if (result[key]) {
          afterState[key] = result[key];
        } else {
          afterState[key] = beforeState[key];
        }
      }
      // save automatically if not yet saved or cancelled
      if (this.isTransacting) {
        tx.save(afterState, eventData);
      }
    } finally {
      tx.finish();
    }
  };

  this.startTransaction = function(beforeState) {
    if (this.isTransacting) {
      throw new Error('Nested transactions are not supported.');
    }
    this.isTransacting = true;
    // TODO: maybe we need to prepare the stage
    this.stage.before = beforeState || {};
    this.emit('transaction:started', this.stage);
    return this.stage;
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

  this._saveTransaction = function(beforeState, afterState, info) {
    // var time = Date.now();
    if (!this.isTransacting) {
      throw new Error('Not in a transaction.');
    }
    this.isTransacting = false;
    var ops = this.stage.getOperations();
    if (ops.length > 0) {
      var documentChange = new DocumentChange(ops, beforeState, afterState);
      // apply the change
      this._apply(documentChange, 'skipStage');
      // push to undo queue and wipe the redo queue
      this.done.push(documentChange);
      this.undone = [];
      // console.log('Document._saveTransaction took %s ms', (Date.now() - time));
      // time = Date.now();
      this._notifyChangeListeners(documentChange, info);
      // console.log('Notifying change listener took %s ms', (Date.now() - time));
    }
  };

  this._cancelTransaction = function() {
    if (!this.isTransacting) {
      throw new Error('Not in a transaction.');
    }
    this.isTransacting = false;
  };

  this._apply = function(documentChange, mode) {
    if (this.isTransacting) {
      throw new Error('Can not replay a document change during transaction.');
    }
    // Note: we apply everything doubled, to keep the staging clone up2date.
    if (mode !== 'skipStage') {
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
