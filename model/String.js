'use strict';

var isString = require('lodash/lang/isString');

/**
  String incremental updates API.

  @class
 */

function StringUpdater() {
  StringUpdater.super.apply(this, arguments);
}

StringUpdater.Prototype = function() {

  /**
    Insert a value into a string

    @param {model/TransactionDocument} tx the document instance
    @param {Array} path path to property
    @param {Number} offset position in string
    @param {String} value value to insert

    @example

    ```js
      var Str = require('substance/model/String')
      
      Str.insert(tx, ['a', 'b'], 3,  "ef");
    ```
  */
  this.insert = function(tx, path, offset, value) {
    var oldValue = tx.nodes.get(path);
    if (isString(oldValue)) {
      var diff = { insert: { offset: offset, value: value } };
      return tx.update(path, diff);
    } else {
      throw new Error('Value type is not supported:', JSON.stringify(oldValue));
    }
  };

  /**
    Delete a value from a string

    @param {model/TransactionDocument} tx the document instance
    @param {Array} path path to property
    @param {Number} startOffset start position from a certain range
    @param {Number} endOffset end position from a certain range

    @example

    ```js
      var Str = require('substance/model/String')
      
      Str.delete(tx, ['a', 'b'], 3, 4);
    ```
  */
  this.delete = function(tx, path, startOffset, endOffset) {
    var oldValue = tx.nodes.get(path);
    if (isString(oldValue)) {
      var diff = { delete: { start: startOffset, end: endOffset } };
      return tx.update(path, diff);
    } else {
      throw new Error('Value type is not supported:', JSON.stringify(oldValue));
    }
  };
};

module.exports = StringUpdater;