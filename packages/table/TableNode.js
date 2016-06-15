'use strict';

var BlockNode = require('../../model/BlockNode');

function TableNode() {
  TableNode.super.apply(this, arguments);
}

TableNode.Prototype = function() {

  this.getRowCount = function() {
    return this.cells.length;
  };

  this.getColCount = function() {
    if (this.cells.length > 0) {
      return this.cells[0].length;
    } else {
      return 0;
    }
  };

};

BlockNode.extend(TableNode);

TableNode.static.name = "table";

TableNode.static.defineSchema({
  // HACK: very low-levelish schema, where the objects will be entries
  // like `{ content: 'p1'}` plus maybe some more meta such as `cellType`
  // TODO: refine when we know exactly what we need
  "cells": { type: ['array', 'array', 'id'], default: [] }
});

module.exports = TableNode;
