'use strict';

var oo = require('../../util/oo');
var BlockNode = require('../../model/BlockNode');
var ParentNodeMixin = require('../../model/ParentNodeMixin');
var TableMatrix = require('./TableMatrix');
var TableCellIterator = require('./TableCellIterator');

function Table() {
  Table.super.apply(this, arguments);

  this.matrix = null;
}

Table.Prototype = function() {

  this.getChildrenProperty = function() {
    return 'sections';
  };

  this.getSections = function() {
    return this.getChidren();
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

  this.getSize = function ( dimension ) {
    var dim = this.matrix.getSize();
    if ( dimension === 'row' ) {
      return dim[0];
    } else if ( dimension === 'col' ) {
      return dim[1];
    } else {
      return dim;
    }
  };

};

oo.inherit(Table, BlockNode);
oo.mixin(Table, ParentNodeMixin);

Table.static.name = "table";

Table.static.defineSchema({
  "sections": { type: ["id"], 'default': [] }
});

module.exports = Table;
