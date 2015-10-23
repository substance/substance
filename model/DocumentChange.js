'use strict';

var OO = require('../util/oo');
var PathAdapter = require('../util/PathAdapter');
var uuid = require('../util/uuid');

function DocumentChange(ops, before, after) {
  this.id = uuid();
  this.ops = ops.slice(0);
  this.before = before;
  this.after = after;
  this.updated = null;
  this.created = null;
  this.deleted = null;
  this._init();
  Object.freeze(this);
  Object.freeze(this.ops);
  Object.freeze(this.before);
  Object.freeze(this.after);
  // FIXME: ATM this is not possible, as NotifyPropertyChange monkey patches this info
  // Object.freeze(this.updated);
  // Object.freeze(this.deleted);
  // Object.freeze(this.created);
}

DocumentChange.Prototype = function() {

  this._init = function() {
    var ops = this.ops;
    var created = {};
    var deleted = {};
    var updated = new PathAdapter.Arrays();
    var i;
    for (i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (op.type === "create") {
        created[op.val.id] = op.val;
        delete deleted[op.val.id];
      }
      if (op.type === "delete") {
        delete created[op.val.id];
        delete updated[op.val.id];
        deleted[op.val.id] = op.val;
      }
      if (op.type === "set" || op.type === "update") {
        // The old as well the new one is affected
        updated.add(op.path, op);
      }
    }
    this.created = created;
    this.deleted = deleted;
    this.updated = updated;
  };

  this.isAffected = function(path) {
    return !!this.updated.get(path);
  };

  this.isUpdated = this.isAffected;

  this.invert = function() {
    var ops = [];
    for (var i = this.ops.length - 1; i >= 0; i--) {
      ops.push(this.ops[i].invert());
    }
    var before = this.after;
    var after = this.before;
    return new DocumentChange(ops, before, after);
  };

  this.traverse = function(fn, ctx) {
    this.updated.traverse(function() {
      fn.apply(ctx, arguments);
    });
  };

  this.getUpdates = function(path) {
    return this.updated.get(path) || [];
  };

  this.getCreated = function() {
    return this.created;
  };

  this.getDeleted = function() {
    return this.deleted;
  };

};

OO.initClass(DocumentChange);

module.exports = DocumentChange;
