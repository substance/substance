'use strict';

var DocumentNode = require('../../model/DocumentNode');
var ParentNodeMixin = require('../../model/ParentNodeMixin');

function TableRow() {
  TableRow.super.apply(this, arguments);
}

DocumentNode.extend(TableRow, ParentNodeMixin, function TableRowPrototype() {

  this.getChildrenProperty = function() {
    return 'cells';
  };

  this.getCells = function() {
    return this.getChildren();
  };

  this.getCellAt = function(cellIdx) {
    return this.getChildAt(cellIdx);
  };
});

TableRow.static.name = "table-row";

TableRow.static.defineSchema({
  "parent": "id",
  "cells": { type: ["id"], default: [] }
});

module.exports = TableRow;
