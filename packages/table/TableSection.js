'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');
var ParentNodeMixin = require('../../model/ParentNodeMixin');

function TableSection() {
  TableSection.super.apply(this, arguments);
}

TableSection.Prototype = function() {

  this.getChildrenProperty = function() {
    return 'rows';
  };

  this.getRows = function() {
    return this.getChildren();
  };

  this.getRowAt = function(rowIdx) {
    return this.getChildAt(rowIdx);
  };
};

oo.inherit(TableSection, DocumentNode);
oo.mixin(TableSection, ParentNodeMixin);

TableSection.static.name = "table-section";

TableSection.static.defineSchema({
  "parent": "id",
  "rows": { type: ["id"], default: [] },
  "sectionType": { type: "string", default: 'tbody'},
});

module.exports = TableSection;
