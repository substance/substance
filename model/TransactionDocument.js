'use strict';

var _ = require('../util/helpers');
var oo = require('../util/oo');
var AbstractDocument = require('./AbstractDocument');
var DocumentChange = require('./DocumentChange');

var __id__ = 0;

/**
  A {@link model/Document} instance that is used during transaction.

  During editing a TransactionDocument is kept up-to-date with the real one.
  Whenever a transaction is started on the document, a TransactionDocument is used to
  record changes, which are applied en-bloc when the transaction is saved.

  @example

  To start a transaction run

  ```
  doc.transaction(function(tx) {
    // use tx to record changes
  });
  ```

*/
function TransactionDocument(document) {
  AbstractDocument.call(this, document.schema);
  this.__id__ = "TX_"+__id__++;

  this.document = document;
  // ops recorded since transaction start
  this.ops = [];
  // app information state information used to recover the state before the transaction
  // when calling undo
  this.before = {};
  // HACK: copying all indexes
  _.each(document.data.indexes, function(index, name) {
    this.data.addIndex(name, index.clone());
  }, this);

  this.loadSeed(document.toJSON());
}

TransactionDocument.Prototype = function() {

  this.isTransaction = function() {
    return true;
  };

  this.reset = function() {
    this.ops = [];
    this.before = {};
  };

  /**
    @include model/AbstractDocument#set
  */
  this.create = function(nodeData) {
    var op = this.data.create(nodeData);
    if (!op) return;
    if (this.document.isTransacting) {
      this.ops.push(op);
    }
    // TODO: incremental graph returns op not the node,
    // so probably here we should too?
    return this.data.get(nodeData.id);
  };

  /**
    @include model/AbstractDocument#set
  */
  this.delete = function(nodeId) {
    var op = this.data.delete(nodeId);
    if (!op) return;
    if (this.document.isTransacting) {
      this.ops.push(op);
    }
    return op;
  };

  /**
    @include model/AbstractDocument#set
  */
  this.set = function(path, value) {
    var op = this.data.set(path, value);
    if (!op) return;
    if (this.document.isTransacting) {
      this.ops.push(op);
    }
    return op;
  };

  /**
    @include model/AbstractDocument#set
  */
  this.update = function(path, diffOp) {
    var op = this.data.update(path, diffOp);
    if (!op) return;
    if (this.document.isTransacting) {
      this.ops.push(op);
    }
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

  this.apply = function(documentChange) {
    _.each(documentChange.ops, function(op) {
      this.data.apply(op);
      this._updateContainers(op);
    }, this);
  };

  this.getIndex = function(name) {
    return this.data.getIndex(name);
  };

  this.createSelection = function() {
    return this.document.createSelection.apply(this, arguments);
  };

  this.getSchema = function() {
    return this.schema;
  };

  this._transaction = function(beforeState, eventData, transformation) {
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
    this._startTransaction(_.clone(beforeState));
    // console.log('Starting the transaction took', Date.now() - time);
    try {
      // time = Date.now();
      var result = transformation(this, beforeState);
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
      // save automatically if not _isCancelled
      if (!this._isCancelled) {
        return this._saveTransaction(afterState, eventData);
      }
    } finally {
      if (!this._isSaved) {
        this.cancel();
      }
      // HACK: making sure that the state is reset when an exception has occurred
      this.document.isTransacting = false;
    }
  };

  this._startTransaction = function(beforeState) {
    // TODO: maybe we need to prepare the stage
    this.before = beforeState || {};
    this._isCancelled = false;
    this._isSaved = false;
    this.document.emit('transaction:started', this);
  };

  this._saveTransaction = function(afterState, info) {
    if (this._isCancelled) {
      return;
    }
    var doc = this.document;
    var beforeState = this.before;
    afterState = _.extend({}, beforeState, afterState);
    var ops = this.ops;
    var change;
    if (ops.length > 0) {
      change = new DocumentChange(ops, beforeState, afterState);
      // apply the change
      doc._apply(change, 'saveTransaction');
      // push to undo queue and wipe the redo queue
      doc.done.push(change);
      doc.undone = [];
      // console.log('Document._saveTransaction took %s ms', (Date.now() - time));
      // time = Date.now();
      if (!info.silent) {
        // TODO: I would like to wrap this with a try catch.
        // however, debugging gets inconvenient as caught exceptions don't trigger a breakpoint
        // by default, and other libraries such as jquery throw noisily.
        doc._notifyChangeListeners(change, info);
      }
      // console.log('Notifying change listener took %s ms', (Date.now() - time));
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

};

oo.inherit(TransactionDocument, AbstractDocument);

module.exports = TransactionDocument;
