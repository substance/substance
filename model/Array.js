'use strict';

var isArray = require('lodash/lang/isArray');

function ArrayUpdater() {
  ArrayUpdater.super.apply(this, arguments);
}

ArrayUpdater.Prototype = function() {

  this.insert = function(tx, path, offset, value) {
    if (isArray(oldValue)) {
      var diff = { insert: { offset: offset, value: value } }
      var op = tx.data.update(path, diff);
      if (!op) return;
      if (tx.document.isTransacting) {
        tx.ops.push(op);
      }
      return op;
    } else {
      throw new Error('Value type is not supported:', JSON.stringify(value));
    }
  }

  this.delete = function(tx, path, offset) {
    if (isArray(oldValue)) {
      var diff = { delete: { offset: offset } }
      var op = tx.data.update(path, diff);
      if (!op) return;
      if (tx.document.isTransacting) {
        tx.ops.push(op);
      }
      return op;
    } else {
      throw new Error('Value type is not supported:', JSON.stringify(value));
    }
  }
};

module.exports = ArrayUpdater;