'use strict';

var _ = require('../util/helpers');
var oo = require('../util/oo');
var AbstractDocument = require('./AbstractDocument');

var __id__ = 0;

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
    this._resetContainers();
  };

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

  this.delete = function(nodeId) {
    var op = this.data.delete(nodeId);
    if (!op) return;
    if (this.document.isTransacting) {
      this.ops.push(op);
    }
    return op;
  };

  this.set = function(path, value) {
    var op = this.data.set(path, value);
    if (!op) return;
    this._updateContainers(op);
    if (this.document.isTransacting) {
      this.ops.push(op);
    }
    return op;
  };

  this.update = function(path, diffOp) {
    var op = this.data.update(path, diffOp);
    if (!op) return;
    this._updateContainers(op);
    if (this.document.isTransacting) {
      this.ops.push(op);
    }
    return op;
  };

  this.save = function(afterState, info) {
    var before = this.before;
    var after = _.extend({}, before, afterState);
    this.document._saveTransaction(before, after, info);
    // reset after finishing
    this.reset();
  };

  this.cancel = function() {
    // revert all recorded changes
    for (var i = this.ops.length - 1; i >= 0; i--) {
      this.data.apply(this.ops[i].invert());
    }
    this.document._cancelTransaction();
    this.reset();
  };

  this.finish = function() {
    if (this.document.isTransacting) {
      this.cancel();
    }
  };

  this.cleanup = this.finish;

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

  // Called back by Substance.Data after a node instance has been created
  this._didCreateNode = function(node) {
    node.document = this;
  };

  this._didDeleteNode = function(node) {
    node.document = null;
  };

  this.createSelection = function() {
    return this.document.createSelection.apply(this, arguments);
  };

  this.getSchema = function() {
    return this.schema;
  };

};

oo.inherit(TransactionDocument, AbstractDocument);

module.exports = TransactionDocument;
