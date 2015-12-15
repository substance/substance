'use strict';

var isString = require('lodash/lang/isString');
var isArray = require('lodash/lang/isArray');
var cloneDeep = require('lodash/lang/cloneDeep');
var Data = require('./Data');
var ObjectOperation = require('./ObjectOperation');
var ArrayOperation = require('./ArrayOperation');
var TextOperation = require('./TextOperation');

/**
  Incremental data storage implemention.

  @class IncrementalData
  @extends model/data/Data
  @private
 */

/**
  @constructor
  @param {Schema} schema
  @param {Object} [options]
*/
var IncrementalData = function(schema, options) {
  IncrementalData.super.call(this, schema, options);
};

IncrementalData.Prototype = function() {

  /**
    Create a new node.

    @param {Object} nodeData
    @returns {ObjectOperation} The applied operation.
   */
  this.create = function(nodeData) {
    var op = ObjectOperation.Create([nodeData.id], nodeData);
    this.apply(op);
    return op;
  };

  /**
    Delete a node.

    @param {String} nodeId
    @returns {ObjectOperation} The applied operation.
   */
  this.delete = function(nodeId) {
    var op = null;
    var node = this.get(nodeId);
    if (node) {
      var nodeData = node.toJSON();
      op = ObjectOperation.Delete([nodeId], nodeData);
      this.apply(op);
    }
    return op;
  };

  /**
    Update a property incrementally.

    The diff can be of the following forms (depending on the updated property type):
      - String:
        - `{ insert: { offset: Number, value: Object } }`
        - `{ delete: { start: Number, end: Number } }`
      - Array:
        - `{ insert: { offset: Number, value: Object } }`
        - `{ delete: { offset: Number } }`

    @param {Array} path
    @param {Object} diff
    @returns {ObjectOperation} The applied operation.
  */
  this.update = function(path, diff) {
    var diffOp = this._getDiffOp(path, diff);
    var op = ObjectOperation.Update(path, diffOp);
    this.apply(op);
    return op;
  };

  /**
    Set a property to a new value

    @param {Array} path
    @param {Object} newValue
    @returns {ObjectOperation} The applied operation.
   */
  this.set = function(path, newValue) {
    var oldValue = this.get(path);
    var op = ObjectOperation.Set(path, oldValue, newValue);
    this.apply(op);
    return op;
  };

  /**
    Apply a given operation.

    @param {ObjectOperation} op
   */
  this.apply = function(op) {
    if (op.type === ObjectOperation.NOP) return;
    else if (op.type === ObjectOperation.CREATE) {
      // clone here as the operations value must not be changed
      this.super.create.call(this, cloneDeep(op.val));
    } else if (op.type === ObjectOperation.DELETE) {
      this.super.delete.call(this, op.val.id);
    } else if (op.type === ObjectOperation.UPDATE) {
      var oldVal = this.get(op.path);
      var diff = op.diff;
      if (op.propertyType === 'array') {
        if (! (diff instanceof ArrayOperation) ) {
          diff = ArrayOperation.fromJSON(diff);
        }
        // array ops work inplace
        diff.apply(oldVal);
      } else if (op.propertyType === 'string') {
        if (! (diff instanceof TextOperation) ) {
          diff = TextOperation.fromJSON(diff);
        }
        var newVal = diff.apply(oldVal);
        this.super.set.call(this, op.path, newVal);
      } else {
        throw new Error("Unsupported type for operational update.");
      }
    } else if (op.type === ObjectOperation.SET) {
      this.super.set.call(this, op.path, op.val);
    } else {
      throw new Error("Illegal state.");
    }
    this.emit('operation:applied', op, this);
  };

  /**
    Creates proper operation based on provided node path and diff.

    @param {Array} path
    @param {Object} diff
    @returns {ObjectOperation} operation.

    @private
  */
  this._getDiffOp = function(path, diff) {
    var diffOp = null;
    if (diff.isOperation) {
      diffOp = diff;
    } else {
      var value = this.get(path);
      var start, end, pos, val;
      if (value === null || value === undefined) {
        throw new Error('Property has not been initialized: ' + JSON.stringify(path));
      } else if (isString(value)) {
        if (diff['delete']) {
          // { delete: [2, 5] }
          start = diff['delete'].start;
          end = diff['delete'].end;
          diffOp = TextOperation.Delete(start, value.substring(start, end));
        } else if (diff['insert']) {
          // { insert: [2, "foo"] }
          pos = diff['insert'].offset;
          val = diff['insert'].value;
          diffOp = TextOperation.Insert(pos, val);
        }
      } else if (isArray(value)) {
        if (diff['delete']) {
          // { delete: 2 }
          pos = diff['delete'].offset;
          diffOp = ArrayOperation.Delete(pos, value[pos]);
        } else if (diff['insert']) {
          // { insert: [2, "foo"] }
          pos = diff['insert'].offset;
          val = diff['insert'].value;
          diffOp = ArrayOperation.Insert(pos, val);
        }
      }
    }
    if (!diffOp) {
      throw new Error('Unsupported diff: ' + JSON.stringify(diff));
    }
    return diffOp;
  };

};

Data.extend(IncrementalData);

module.exports = IncrementalData;
