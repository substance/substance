'use strict';

var Node = require('../../model/DocumentNode');

var TableCell = Node.extend({
  displayName: "TableCell",
  name: "table-cell",
  properties: {
    "parent": "id",
    "cellType": "string", // "head" or "data"
    "colspan": "number",
    "rowspan": "number",
    "content": "string"
  },
  getSpan: function(dim) {
    if (dim === "col") {
      return this.colspan || 1;
    } else if (dim === "row") {
      return this.rowspan || 1;
    }
  }
});

TableCell.static.components = ['content'];

TableCell.static.defaultProperties = {
  cellType: "td",
  content: ""
};

Object.defineProperties(TableCell.prototype, {
  isData: {
    'get': function() {
      return this.cellType === "data";
    }
  }
});

module.exports = TableCell;
