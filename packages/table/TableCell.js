'use strict';

var DocumentNode = require('../../model/DocumentNode');
var Schema = require('../../model/DocumentSchema');

function TableCell() {
  TableCell.super.apply(this, arguments);
};

oo.inherit(TableCell, DocumentNode);

TableCell.static.name = "table-cell";

TableCell.static.defineSchema({
  parent: { type: Schema.Id, required: true },
  cellType: { type: String, 'default': 'td' }, // "head" or "data"
  colspan: Number,
  rowspan: Number,
  content: Schema.Text
});

TableCell.prototype.getSpan = function(dim) {
  if (dim === "col") {
    return this.colspan || 1;
  } else if (dim === "row") {
    return this.rowspan || 1;
  }
};

Object.defineProperties(TableCell.prototype, {
  isData: {
    'get': function() {
      return this.cellType === "data";
    }
  }
});

module.exports = TableCell;
