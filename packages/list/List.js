'use strict';

var _ = require('../../util/helpers');
var $ = require('../../util/jquery');
var DocumentNode = require('../../model/DocumentNode');
var ListItem = require('./ListItem');
var ParentNodeMixin = require('../../model/ParentNodeMixin');

// Note: we have chosen a semi-hierarchical model for lists
// consisting of one list wrapper with many list items.
// Nesting and type information is stored on the items.
// This will make life easier for editing.
// The wrapping list node helps us to create a scope for rendering, and
// import/export.
var List = DocumentNode.extend(ParentNodeMixin.prototype, {
  displayName: "List",
  name: "list",
  properties: {
    ordered: "boolean",
    items: ["array", "id"]
  },
  didInitialize: function() {
    // call mix-in initializer
    ParentNodeMixin.call(this, 'items');
  },

  getItems: function() {
    var doc = this.getDocument();
    return _.map(this.items, function(id) {
      return doc.get(id);
    }, this);
  },

  removeItem: function(id) {
    var doc = this.getDocument();
    var offset = this.items.indexOf(id);
    if (offset >= 0) {
      doc.update([this.id, 'items'], { "delete": { offset: offset } });
    } else {
      throw new Error('List item is not a child of this list: ' + id);
    }
  },
  insertItemAt: function(offset, id) {
    var doc = this.getDocument();
    doc.update([this.id, 'items'], { "insert": { offset: offset, value: id } });
  },

});

List.static.components = ['items'];

// HtmlImporter

List.static.blockType = true;

Object.defineProperties(List.prototype, {
  itemNodes: {
    'get': function() {
      return this.getItems();
    }
  }
});

module.exports = List;
