'use strict';

var isArray = require('lodash/lang/isArray');

/**
  Array incremental updates API.

  @class
 */

function ArrayUpdater() {
  ArrayUpdater.super.apply(this, arguments);
}

ArrayUpdater.Prototype = function() {

  /**
    Insert a value into an array

    @param {model/TransactionDocument} tx the document instance
    @param {Array} path path to property
    @param {Number} offset position in array
    @param {any} value value to insert

    @example

    ```js
      var Arr = require('substance/model/Array')
      
      Arr.insert(tx, ['body', 'nodes'], 3, 'p1');
    ```
  */
  this.insert = function(tx, path, offset, value) {
    if (isArray(oldValue)) {
      var diff = { insert: { offset: offset, value: value } }
      return tx.update(path, diff);
    } else {
      throw new Error('Value type is not supported:', JSON.stringify(value));
    }
  }

  /**
    Delete a value from an array

    @param {model/TransactionDocument} tx the document instance
    @param {Array} path path to property
    @param {Number} offset position in array

    @example

    ```js
      var Arr = require('substance/model/Array')
      
      Arr.delete(tx, ['body', 'nodes'], 3);
    ```
  */
  this.delete = function(tx, path, offset) {
    if (isArray(oldValue)) {
      var diff = { delete: { offset: offset } }
      return tx.update(path, diff);
    } else {
      throw new Error('Value type is not supported:', JSON.stringify(value));
    }
  }
};

module.exports = ArrayUpdater;