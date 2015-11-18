'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');

function TableCell() {
  TableCell.super.apply(this, arguments);
}

oo.inherit(TableCell, DocumentNode);

TableCell.static.name = "table-cell";

TableCell.static.defineSchema({
  parent: "id",
  cellType: { type: "string", 'default': 'td' }, // "head" or "data"
  colspan: { type: "number", optional: true },
  rowspan: { type: "number", optional: true },
  content: "text"
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
