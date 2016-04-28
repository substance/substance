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
    tableCell.content = converter.annotatedText(el, [tableCell.id, 'content']);
  },

  export: function(cell, el, converter) {
    var tagName = (cell.cellType==="head" ? "th" : "td");
    el.setTagName(tagName);
    el.append(
      converter.annotatedText([cell.id, 'content'])
    );
    return el;
  }

};
