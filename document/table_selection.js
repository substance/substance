'use strict';

var Substance = require('../basics');
var _ = require('../basics/helpers');
var Selection = require('./selection');

function TableSelection(properties) {
  this.tableId = properties.tableId;
  if (properties.rectangle) {
    this.rectangle = properties.rectangle;
  } else {
    this.rectangle = new TableSelection.Rectangle(properties.startRow, properties.startCol,
      properties.endRow, properties.endCol);
  }
  if (!this.tableId) {
    throw new Error('Invalid arguments. `tableId` is mandatory.');
  }
  this._internal = {};
  Object.freeze(this);
}

TableSelection.Prototype = function() {

  this.isPropertySelection = function() {
    return false;
  };

  this.isTableSelection = function() {
    return true;
  };

  this.isSingleCell = function() {
    return this.rectangle.isSingleCell();
  };

  this.getTableId = function() {
    return this.tableId;
  };

  this.getRectangle = function() {
    return this.rectangle;
  };

  this.equals = function(other) {
    return (Selection.prototype.equals.call(this, other) &&
      !other.isTableSelection() &&
      (this.startRow === other.startRow && this.endRow === other.endRow &&
       this.startCol === other.startCol && this.ednCol === other.endCol ));
  };

  this.toString = function() {
    var r = this.rectangle;
    return "T[("+ r.start.row + "," + r.start.col + "), ("+ r.end.row + ", " + r.end.col +")]";
  };

  this.attach = function(doc) {
    this._internal.doc = doc;
    return this;
  };

};

Substance.inherit(TableSelection, Selection);

Object.defineProperties(TableSelection.prototype, {
  startRow: {
    get: function() {
      return this.rectangle.start.row;
    }
  },
  endRow: {
    get: function() {
      return this.rectangle.end.row;
    }
  },
  startCol: {
    get: function() {
      return this.rectangle.start.col;
    }
  },
  endCol: {
    get: function() {
      return this.rectangle.end.col;
    }
  },
});

TableSelection.Rectangle = function(startRow, startCol, endRow, endCol) {
  var minRow = Math.min(startRow, endRow);
  var maxRow = Math.max(startRow, endRow);
  var minCol = Math.min(startCol, endCol);
  var maxCol = Math.max(startCol, endCol);

  this.start = {
    row: minRow,
    col: minCol
  };
  this.end = {
    row: maxRow,
    col: maxCol
  };
  Object.freeze(this.start);
  Object.freeze(this.end);
  Object.freeze(this);
};

TableSelection.Rectangle.prototype.isSingleCell = function() {
  return (this.start.row === this.end.row && this.start.col === this.end.col);
};

module.exports = TableSelection;
