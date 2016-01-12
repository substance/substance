'use strict';

var isFunction = require('lodash/lang/isFunction');
var extend = require('lodash/object/extend');
var each = require('lodash/collection/each');
var Document = require('./Document');
var DocumentChange = require('./DocumentChange');
var IncrementalData = require('./data/IncrementalData');
var DocumentNodeFactory = require('./DocumentNodeFactory');

var __id__ = 0;

/**
  A {@link model/Document} instance that is used during transaction.

  During editing a TransactionDocument is kept up-to-date with the real one.
  Whenever a transaction is started on the document, a TransactionDocument is used to
  record changes, which are applied en-bloc when the transaction is saved.

  @class
  @extends model/AbstractDocument
  @example

  @param {model/Document} document a document instance

  To start a transaction run

  ```
  doc.transaction(function(tx) {
    // use tx to record changes
  });
  ```
*/
function TransactionDocument(document, session) {
  this.__id__ = "TX_"+__id__++;

  this.schema = document.schema;
  this.nodeFactory = new DocumentNodeFactory(this);
  this.data = new IncrementalData(this.schema, {
    nodeFactory: this.nodeFactory
  });

  this.document = document;
  this.session = session;

  // ops recorded since transaction start
  this.ops = [];
  // app information state information used to recover the state before the transaction
  // when calling undo
  this.before = {};
  // HACK: copying all indexes
  each(document.data.indexes, function(index, name) {
    this.data.addIndex(name, index.clone());
  }, this);

  this.loadSeed(document.toJSON());
}

TransactionDocument.Prototype = function() {

  this.reset = function() {
    this.ops = [];
    this.before = {};
  };

  this.create = function(nodeData) {
    var op = this.data.create(nodeData);
    if (!op) return;
    this.ops.push(op);
    // TODO: incremental graph returns op not the node,
    // so probably here we should too?
    return this.data.get(nodeData.id);
  };

  this.delete = function(nodeId) {
    var op = this.data.delete(nodeId);
    if (!op) return;
    this.ops.push(op);
    return op;
  };

  this.set = function(path, value) {
    var op = this.data.set(path, value);
    if (!op) return;
    this.ops.push(op);
    return op;
  };

  this.update = function(path, diffOp) {
    var op = this.data.update(path, diffOp);
    if (!op) return;
    this.ops.push(op);
    return op;
  };

  /**
    Cancels the current transaction, discarding all changes recorded so far.
  */
  this.cancel = function() {
    this._cancelTransaction();
  };

  this.getOperations = function() {
    return this.ops;
  };

  this._apply = function(documentChange) {
    each(documentChange.ops, function(op) {
      this.data.apply(op);
    }, this);
  };

  this._transaction = function(transformation) {
    if (!isFunction(transformation)) {
      throw new Error('Document.transaction() requires a transformation function.');
    }
    // var time = Date.now();
    // HACK: ATM we can't deep clone as we do not have a deserialization
    // for selections.
    this._startTransaction();
    // console.log('Starting the transaction took', Date.now() - time);
    try {
      // time = Date.now();
      transformation(this, {});
      // console.log('Executing the transformation took', Date.now() - time);
      // save automatically if not canceled
      if (!this._isCancelled) {
        return this._saveTransaction();
      }
    } finally {
      if (!this._isSaved) {
        this.cancel();
      }
      // HACK: making sure that the state is reset when an exception has occurred
      this.session.isTransacting = false;
    }
  };

  this._startTransaction = function() {
    this.before = {};
    this.after = {};
    this.info = {};
    this._isCancelled = false;
    this._isSaved = false;
    // TODO: we should use a callback and not an event
    // Note: this is used to initialize
    this.document.emit('transaction:started', this);
  };

  this._saveTransaction = function() {
    if (this._isCancelled) {
      return;
    }
    var beforeState = this.before;
    var afterState = extend({}, beforeState, this.after);
    var ops = this.ops;
    var change;
    if (ops.length > 0) {
      change = new DocumentChange(ops, beforeState, afterState);
    }
    this._isSaved = true;
    this.reset();
    return change;
  };

  this._cancelTransaction = function() {
    // revert all recorded changes
    for (var i = this.ops.length - 1; i >= 0; i--) {
      this.data.apply(this.ops[i].invert());
    }
    // update state
    this._isCancelled = true;
    this.reset();
  };

  this.newInstance = function() {
    return this.document.newInstance();
  };

};

Document.extend(TransactionDocument);

module.exports = TransactionDocument;
