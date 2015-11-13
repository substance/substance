'use strict';

/*
 * HTML converter for Paragraphs.
 */
module.exports = {

  type: "table-cell",

  matchElement: function(el) {
    return el.is('th, td');
  },

  import: function(el, tableCell, converter) {
    var id = converter.defaultId(el, 'heading');
    if (el.is('th')) {
      tableCell.cellType = "head";
    } else {
      tableCell.cellType = "data";
    }
    var colspan = el.attr('colspan');
    if (colspan) {
      tableCell.colspan = parseInt(colspan, 10);
    }
    var rowspan = el.attr('rowspan');
    if (rowspan) {
      tableCell.rowspan = parseInt(rowspan, 10);
    }
    tableCell.content = converter.annotatedText(el, [id, 'content']);
  },

  export: function(cell, el, converter) {
    el.tagName = (cell.cellType==="head" ? "th" : "td");
    el.append(
      converter.annotatedText([cell.id, 'content'])
    );
  }

};
