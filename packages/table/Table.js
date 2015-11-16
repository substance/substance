'use strict';

var oo = require('../../util/oo');
var _ = require('../../util/helpers');
var Node = require('../../model/DocumentNode');
var TableMatrix = require('./TableMatrix');
var ParentNodeMixin = require('../../model/ParentNodeMixin');

var Table = Node.extend(ParentNodeMixin.prototype, {

  name: "table",
  matrix: null,
  properties: {
    "sections": ["array", "id"],
  },

  didInitialize: function() {
    ParentNodeMixin.call(this, 'sections');
  },

  getSections: function() {
    var doc = this.getDocument();
    return _.map(this.sections, function(id) {
      return doc.get(id);
    }, this);
  },

  getSectionAt: function(secIdx) {
    var doc = this.getDocument();
    var secId = this.sections[secIdx];
    if (secId) {
      return doc.get(secId);
    } else {
      return null;
    }
  },

  attach: function() {
    this.super.attach.apply(this, arguments);
  },

  getMatrix: function() {
    if (!this.matrix) {
      this.matrix = new TableMatrix(this);
      this.matrix.update();
    }
    return this.matrix;
  },

  /*
   * Provides a cell iterator that allows convenient traversal regardless of
   * the structure with respect to sections.
   *
   * @return {ve.dm.TableNode.CellIterator}
   */
  getIterator: function() {
    return new Table.CellIterator(this);
  },

  getSize: function ( dimension ) {
    var dim = this.matrix.getSize();
    if ( dimension === 'row' ) {
      return dim[0];
    } else if ( dimension === 'col' ) {
      return dim[1];
    } else {
      return dim;
    }
  }

});

Object.defineProperties(Table.prototype, {
  rowNodes: {
    'get': function() {
      return this.getRows();
    }
  }
});


Table.static.components = ['sections'];

Table.static.defaultProperties = {
  sections: []
};

Table.static.blockType = true;

/*
 * A helper class to iterate over the cells of a table node.
 *
 * It provides a unified interface to iterate cells in presence of table sections,
 * e.g., providing consecutive row indexes.
 *
 * @class
 * @private
 * @param {ve.dm.TableNode} [tableNode]
 */
Table.CellIterator = function(tableNode) {
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
};

Table.CellIterator.Prototype = function() {

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
oo.initClass(Table.CellIterator);

module.exports = Table;
