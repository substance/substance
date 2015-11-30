'use strict';

var isString = require('lodash/lang/isString');

function StringUpdater() {
  StringUpdater.super.apply(this, arguments);
}

StringUpdater.Prototype = function() {

  this.insert = function(tx, path, offset, value) {
    if (isString(oldValue)) {
      var diff = { insert: { offset: offset, value: value } }
      return tx.update(path, diff);
    } else {
      throw new Error('Value type is not supported:', JSON.stringify(value));
    }
  }

  this.delete = function(tx, path, startOffset, endOffset) {
    if (isString(oldValue)) {
      var diff = { delete: { start: startOffset, end: endOffset } }
      return tx.update(path, diff);
    } else {
      throw new Error('Value type is not supported:', JSON.stringify(value));
    }
  }
};

module.exports = StringUpdater;