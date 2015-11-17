'use strict';

var Node = require('../../model/DocumentNode');

var TableCell = Node.extend();

TableCell.static.name = "table-cell";

TableCell.static.schema = {
  "parent": { type: "id" },
  "cellType": { type: "string", 'default': 'td' }, // "head" or "data"
  "colspan": { type: "number" },
  "rowspan": { type: "number" },
  "content": { type: "text", 'default': ''}
};

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
