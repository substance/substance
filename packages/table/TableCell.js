'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');

function TableCell() {
  TableCell.super.apply(this, arguments);
}

TableCell.Prototype = function() {

  this.getSpan = function(dim) {
    if (dim === "col") {
      return this.colspan || 1;
    } else if (dim === "row") {
      return this.rowspan || 1;
    }
  };

  this.isData = function() {
    return this.cellType === "data";
  };

};

oo.inherit(TableCell, DocumentNode);

TableCell.static.name = "table-cell";

TableCell.static.defineSchema({
  parent: "id",
  cellType: { type: "string", 'default': 'td' }, // "head" or "data"
  colspan: { type: "number", optional: true },
  rowspan: { type: "number", optional: true },
  content: "text"
});

module.exports = TableCell;
