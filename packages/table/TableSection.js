'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');
var ParentNodeMixin = require('../../model/ParentNodeMixin');

function TableSection() {
  TableSection.super.apply(this, arguments);

  ParentNodeMixin.call(this, 'rows');
}

TableSection.Prototype = function() {

  this.getRows = function() {
    var doc = this.getDocument();
    return this.rows.map(function(id) {
      return doc.get(id);
    }.bind(this));
  };
  this.getRowAt = function(rowIdx) {
    var doc = this.getDocument();
    var rowId = this.rows[rowIdx];
    if (rowId) {
      return doc.get(rowId);
    } else {
      return null;
    }
  };
};

oo.inherit(TableSection, DocumentNode);
oo.mixin(TableSection, ParentNodeMixin);

TableSection.static.name = "table-section";
TableSection.static.schema = {
  "parent": { type: "id", mandatory: true },
  "rows": { type: ["array", "id"], 'default': [] },
  "sectionType": { type: "string", 'default': 'tbody'},
};

Object.defineProperties(TableSection.prototype, {
  cellNodes: {
    'get': function() {
      return this.getCells();
    }
  }
});

module.exports = TableSection;
