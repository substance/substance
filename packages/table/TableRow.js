'use strict';

var _ = require('../../util/helpers');
var $ = require('../../util/jquery');
var Node = require('../../model/DocumentNode');
var ParentNodeMixin = require('../../model/ParentNodeMixin');

var TableRow = Node.extend(ParentNodeMixin.prototype, {
  name: "table-row",
  properties: {
    "parent": "id",
    "cells": ["array", "id"]
  },
  didInitialize: function() {
    ParentNodeMixin.call(this, 'cells');
  },
  getCells: function() {
    var doc = this.getDocument();
    return _.map(this.cells, function(id) {
      return doc.get(id);
    }, this);
  },
  getCellAt: function(cellIdx) {
    var doc = this.getDocument();
    var cellId = this.cells[cellIdx];
    if (cellId) {
      return doc.get(cellId);
    } else {
      return null;
    }
  }
});

TableRow.static.components = ['cells'];

TableRow.static.defaultProperties = {
  cells: []
};

Object.defineProperties(TableRow.prototype, {
  cellNodes: {
    'get': function() {
      return this.getCells();
    }
  }
});

module.exports = TableRow;
