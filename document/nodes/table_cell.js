'use strict';

var $ = require('../../basics/jquery');
var Node = require('../node');

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

// HtmlImporter

TableCell.static.matchElement = function($el) {
  return $el.is('th, td');
};

TableCell.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'tcell');
  var tableCell = {
    id: id,
    content: ""
  };
  if ($el.is('th')) {
    tableCell.cellType = "head";
  } else {
    tableCell.cellType = "data";
  }
  var colspan = $el.attr('colspan');
  if (colspan) {
    tableCell.colspan = parseInt(colspan, 10);
  }
  var rowspan = $el.attr('rowspan');
  if (rowspan) {
    tableCell.rowspan = parseInt(rowspan, 10);
  }
  tableCell.content = converter.annotatedText($el, [id, 'content']);
  return tableCell;
};

TableCell.static.toHtml = function(cell, converter) {
  var id = cell.id;
  var tagName = (cell.cellType==="head" ? "th" : "td");
  var $el = $('<' + tagName + '>')
    .attr('id', 'id')
    .append(converter.annotatedText([id, 'content']));
  return $el;
};

Object.defineProperties(TableCell.prototype, {
  isData: {
    'get': function() {
      return this.cellType === "data";
    }
  }
});

module.exports = TableCell;
