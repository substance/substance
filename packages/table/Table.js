'use strict';

var oo = require('../../util/oo');
var extend = require('lodash/extend');
var BlockNode = require('../../model/BlockNode');
var ParentNodeMixin = require('../../model/ParentNodeMixin');
var TableMatrix = require('./TableMatrix');
var TableCellIterator = require('./TableCellIterator');
var uuid = require('../../util/uuid');

function Table() {
  Table.super.apply(this, arguments);

  this.matrix = null;
}

Table.Prototype = function () {

  extend(this, ParentNodeMixin);

  this.getChildrenProperty = function() {
    return 'sections';
  };

  this.getSections = function() {
    return this.getChildren();
  };

  this.getSectionAt = function(secIdx) {
    return this.getChildAt(secIdx);
  };

  this.getMatrix = function() {
    if (!this.matrix) {
      this.matrix = new TableMatrix(this);
      this.matrix.update();
    }
    return this.matrix;
  };

  /*
   * Provides a cell iterator that allows convenient traversal regardless of
   * the structure with respect to sections.
   *
   * @returns {TableCellIterator}
   */
  this.getIterator = function() {
    return new TableCellIterator(this);
  };

  this.getSize = function(dimension) {
    var dim = this.matrix.getSize();
    if ( dimension === 'row' ) {
      return dim[0];
    } else if ( dimension === 'col' ) {
      return dim[1];
    } else {
      return dim;
    }
  };

  this.toTSV = function() {
    var cell;
    var data = [];
    var row = [];
    var it = this.getIterator();
    it.onNewRow = function() {
      row = [];
      data.push(row);
    };
    while( (cell = it.next()) ) {
      row.push(cell.content);
    }
    return data.map(function(row) {
      return row.join('\t');
    }).join('\n');
  };

};

oo.inherit(Table, BlockNode);

Table.static.name = "table";

Table.static.defineSchema({
  "sections": { type: ["id"], 'default': [] }
});

Table.fromTSV = function(tx, tsv, sep) {
  sep = sep || '\t';
  var lines = tsv.split(/\n/);
  var tableId = uuid('table');
  var sectionData = {
    type: 'table-section',
    id: tableId+'-body',
    sectionType: 'tbody',
    rows: [],
    parent: tableId,
  };
  for (var i = 0; i < lines.length; i++) {
    var rowData = {
      type: 'table-row',
      id: tableId + '-row'+i,
      cells: [],
      parent: sectionData.id,
    };
    var cells = lines[i].split(sep);
    for (var j = 0; j < cells.length; j++) {
      var cellStr = cells[j];
      var cellData = {
        type: 'table-cell',
        id: rowData.id + '-col' + j,
        cellType: 'td',
        content: cellStr,
        parent: rowData.id,
      };
      var cell = tx.create(cellData);
      rowData.cells.push(cell.id);
    }
    var row = tx.create(rowData);
    sectionData.rows.push(row.id);
  }
  var section = tx.create(sectionData);
  return tx.create({
    type: 'table',
    id: tableId,
    sections: [section.id]
  });
};

module.exports = Table;
