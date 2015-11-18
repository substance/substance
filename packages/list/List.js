'use strict';

var oo = require('../../util/oo');
var BlockNode = require('../../model/BlockNode');
var ParentNodeMixin = require('../../model/ParentNodeMixin');

// Note: we have chosen a semi-hierarchical model for lists
// consisting of one list wrapper with many list items.
// Nesting and type information is stored on the items.
// This will make life easier for editing.
// The wrapping list node helps us to create a scope for rendering, and
// import/export.
function List() {
  List.super.apply(this, arguments);

  ParentNodeMixin.call(this, 'items');
}

List.Prototype = function() {

  this.getItems = function() {
    var doc = this.getDocument();
    return this.items.map(function(id) {
      return doc.get(id);
    }.bind(this));
  };

  this.removeItem = function(id) {
    var doc = this.getDocument();
    var offset = this.items.indexOf(id);
    if (offset >= 0) {
      doc.update([this.id, 'items'], { "delete": { offset: offset } });
    } else {
      throw new Error('List item is not a child of this list: ' + id);
    }
  };

  this.insertItemAt = function(offset, id) {
    var doc = this.getDocument();
    doc.update([this.id, 'items'], { "insert": { offset: offset, value: id } });
  };

};

oo.inherit(List, BlockNode);

List.static.name = "list";

List.static.defineSchema({
  ordered: { type: "boolean", default: false },
  items: ["id"]
});

Object.defineProperties(List.prototype, {
  itemNodes: {
    'get': function() {
      return this.getItems();
    }
  }
});

module.exports = List;
