'use strict';

var oo = require('../../util/oo');

/*
 * A helper class to iterate over the cells of a table node.
 *
 * It provides a unified interface to iterate cells in presence of table sections,
 * e.g., providing consecutive row indexes.
 *
 * @class
 * @private
 * @param {Table} tableNode
 */
function TableCellIterator(tableNode) {
  this.table = tableNode;

  this.__it = {
    sectionIndex: -1,
    rowIndex: -1,
    rowNode: null,
    cellIndex: -1,
    cellNode: null,
    sectionNode: null,
    finished: false
  };

  // hooks
  this.onNewSection = function() {};
  this.onNewRow = function() {};
}

TableCellIterator.Prototype = function() {

  this.next = function() {
    if (this.__it.finished) throw new Error("TableCellIterator has no more cells left.");
    this.nextCell(this.__it);
    if (this.__it.finished) return null;
    else return this.__it.cellNode;
  };

  this.nextSection = function(it) {
    it.sectionIndex++;
    it.sectionNode = this.table.getSectionAt(it.sectionIndex);
    if (!it.sectionNode) {
      it.finished = true;
    } else {
      it.rowIndex = 0;
      it.rowNode = it.sectionNode.getRowAt(0);
      this.onNewSection(it.sectionNode);
    }
  };

  this.nextRow = function(it) {
    it.rowIndex++;
    if (it.sectionNode) {
      it.rowNode = it.sectionNode.getRowAt(it.rowIndex);
    }
    while (!it.rowNode && !it.finished) {
      this.nextSection(it);
    }
    if (it.rowNode) {
      it.cellIndex = 0;
      it.cellNode = it.rowNode.getCellAt(0);
      this.onNewRow(it.rowNode);
    }
  };

  this.nextCell = function(it) {
    if (it.cellNode) {
      it.cellIndex++;
      it.cellNode = it.rowNode.getCellAt(it.cellIndex);
    }
    // step into the next row if there is no next cell or if the column is
    // beyond the rectangle boundaries
    while (!it.cellNode && !it.finished) {
      this.nextRow(it);
    }
  };
};

oo.initClass(TableCellIterator);

module.exports = TableCellIterator;
