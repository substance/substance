'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');
var ParentNodeMixin = require('../../model/ParentNodeMixin');

function TableRow() {
  TableRow.super.apply(this, arguments);
}

TableRow.Prototype = function() {

  this.getChildrenProperty = function() {
    return 'cells';
  };

  this.getCells = function() {
    return this.getChildren();
  };

  this.getCellAt = function(cellIdx) {
    return this.getChildAt(cellIdx);
  };
};

oo.inherit(TableRow, DocumentNode);

oo.mixin(TableRow, ParentNodeMixin);

TableRow.static.name = "table-row";

TableRow.static.defineSchema({
  "parent": "id",
  "cells": { type: ["id"], default: [] }
});

module.exports = TableRow;
