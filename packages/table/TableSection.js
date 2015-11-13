'use strict';

var _ = require('../../util/helpers');
var $ = require('../../util/jquery');
var Node = require('../../model/DocumentNode');
var ParentNodeMixin = require('../../model/ParentNodeMixin');

var TableSection = Node.extend(ParentNodeMixin.prototype, {
  displayName: "TableSection",
  name: "table-section",
  properties: {
    "parent": "id",
    "rows": ["array", "id"],
    "sectionType": "string",
  },
  didInitialize: function() {
    ParentNodeMixin.call(this, 'rows');
  },
  getRows: function() {
    var doc = this.getDocument();
    return _.map(this.rows, function(id) {
      return doc.get(id);
    }, this);
  },
  getRowAt: function(rowIdx) {
    var doc = this.getDocument();
    var rowId = this.rows[rowIdx];
    if (rowId) {
      return doc.get(rowId);
    } else {
      return null;
    }
  },
});

TableSection.static.components = ['rows'];

TableSection.static.defaultProperties = {
  sectionType: 'tbody',
  rows: []
};

Object.defineProperties(TableSection.prototype, {
  cellNodes: {
    'get': function() {
      return this.getCells();
    }
  }
});

module.exports = TableSection;
