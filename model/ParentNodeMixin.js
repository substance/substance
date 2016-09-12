"use strict";

/**
  Mix-in for parent nodes.

  ParentNodes are nodes which have children nodes,
  such as List, Table, TableSection, TableRow.

  @mixin
*/
var ParentNodeMixin = {

  hasChildren: function() {
    return true;
  },

  getChildrenProperty: function() {
    throw new Error('ParentNodeMixin.getChildrenProperty is abstract and must be implemented in ' + this.type + '.');
  },

  getChildIndex: function(child) {
    return this[this.getChildrenProperty()].indexOf(child.id);
  },

  getChildren: function() {
    var doc = this.getDocument();
    var childrenIds = this[this.getChildrenProperty()];
    return childrenIds.map(function(id) {
      return doc.get(id);
    });
  },

  getChildAt: function(idx) {
    var children = this[this.getChildrenProperty()];
    if (idx < 0 || idx >= children.length) {
      throw new Error('Array index out of bounds: ' + idx + ", " + children.length);
    }
    return this.getDocument().get(children[idx]);
  },

  getChildCount: function() {
    return this[this.getChildrenProperty()].length;
  },

  getAddressablePropertyNames: function() {
    return [this.getChildrenProperty()];
  },

};

export default ParentNodeMixin;
