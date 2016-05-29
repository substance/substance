'use strict';

var isEqual = require('lodash/isEqual');
var Selection = require('../../model/Selection');
var CustomSelection = require('../../model/CustomSelection');

function TableSelection(data) {
  TableSelection.super.apply(this, arguments);
}

TableSelection.Prototype = function() {

  this._isTableSelection = true;

  this.getType = function() {
    return 'table';
  };

  this.toString = function() {
    return "table(", JSON.stringify(this.data) + ")";
  };

  this.equals = function(other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      other._isTableSelection &&
      isEqual(this.data, other.data)
    );
  };

};

CustomSelection.extend(TableSelection);

module.exports = TableSelection;