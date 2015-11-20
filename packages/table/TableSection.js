'use strict';

var DocumentNode = require('../../model/DocumentNode');
var ParentNodeMixin = require('../../model/ParentNodeMixin');

function TableSection() {
  TableSection.super.apply(this, arguments);
}

DocumentNode.extend(TableSection, ParentNodeMixin, function TableSectionPrototype() {

  this.getChildrenProperty = function() {
    return 'rows';
  };

  this.getRows = function() {
    return this.getChildren();
  };

  this.getRowAt = function(rowIdx) {
    return this.getChildAt(rowIdx);
  };
});

TableSection.static.name = "table-section";

TableSection.static.defineSchema({
  "parent": "id",
  "rows": { type: ["id"], default: [] },
  "sectionType": { type: "string", default: 'tbody'},
});

module.exports = TableSection;
