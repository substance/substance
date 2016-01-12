'use strict';

var each = require('lodash/collection/each');

/*
 * HTML converter for TableRow.
 */
module.exports = {

  type: 'table-row',
  tagName: 'tr',

  import: function(el, tableRow, converter) {
    tableRow.cells = [];
    each(el.find('th,td'), function(cellEl) {
      var cellNode = converter.convertElement(cellEl);
      cellNode.parent = tableRow.id;
      tableRow.cells.push(cellNode.id);
    });
  },

  export: function(row, el, converter) {
    each(row.getCells(), function(cell) {
      el.append(converter.convertNode(cell));
    });
  },

};
