'use strict';

var $ = require('../../basics/jquery');
var Node = require('../node');
var _ = require('../../basics/helpers');
var ParentNodeMixin = require('../parent_node_mixin');

var TableRow = Node.extend(ParentNodeMixin.prototype, {
  displayName: "TableRow",
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
  },
});

TableRow.static.components = ['cells'];

TableRow.static.defaultProperties = {
  cells: []
};

// HtmlImporter

TableRow.static.matchElement = function($el) {
  return $el.is('tr');
};

TableRow.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'tr');
  var tableRow = {
    id: id,
    cells: []
  };
  $el.find('th,td').each(function() {
    var $cell = $(this);
    var cellNode = converter.convertElement($cell, { parent: id });
    tableRow.cells.push(cellNode.id);
  });
  return tableRow;
};

TableRow.static.toHtml = function(row, converter) {
  var id = row.id;
  var $el = $('<tr>').attr('id', id);
  _.each(row.getCells(), function(cell) {
    $el.append(cell.toHtml(converter));
  });
  return $el;
};

Object.defineProperties(TableRow.prototype, {
  cellNodes: {
    'get': function() {
      return this.getCells();
    }
  }
});

module.exports = TableRow;
