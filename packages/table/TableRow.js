'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');
var ParentNodeMixin = require('../../model/ParentNodeMixin');

function TableRow() {
  TableRow.super.apply(this, arguments);

  ParentNodeMixin.call(this, 'cells');
}

TableRow.Prototype = function() {
  this.getCells = function() {
    var doc = this.getDocument();
    return this.cells.map(function(id) {
      return doc.get(id);
    }.bind(this));
  };
  this.getCellAt = function(cellIdx) {
    var doc = this.getDocument();
    var cellId = this.cells[cellIdx];
    if (cellId) {
      return doc.get(cellId);
    } else {
      return null;
    }
  };
};

oo.inherit(TableRow, DocumentNode);

oo.mixin(TableRow, ParentNodeMixin);

TableRow.static.name = "table-row";

TableRow.static.defineSchema({
  "parent": "id",
  "cells": { type: ["id"], default: [] }
});

Object.defineProperty(TableRow.prototype, 'cellNodes', {
  'get': function() {
    return this.getCells();
  }
});

module.exports = TableRow;
