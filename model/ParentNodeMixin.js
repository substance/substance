"use strict";

var oo = require('../util/oo');

/*
 * Mix-in for parent nodes.
 *
 * ParentNodes are nodes which have children nodes,
 * such as List, Table, TableSection, TableRow.
 *
 * @class
 * @mixin
 */
function ParentNodeMixin() {}

ParentNodeMixin.Prototype = function() {

  this.hasChildren = function() {
    return true;
  };

  this.getChildrenProperty = function() {
    throw new Error('ParentNodeMixin.getChildrenProperty is abstract and must be implemented in ' + this.constructor.name + '.');
  };

  this.getChildIndex = function(child) {
    return this[this.getChildrenProperty()].indexOf(child.id);
  };

  this.getChildren = function() {
    var doc = this.getDocument();
    var childrenIds = this[this.getChildrenProperty()];
    return childrenIds.map(function(id) {
      return doc.get(id);
    }.bind(this));
  };

  this.getChildAt = function(idx) {
    var children = this[this.getChildrenProperty()];
    if (idx < 0 || idx >= children.length) {
      throw new Error('Array index out of bounds: ' + idx + ", " + children.length)
    }
    return this.getDocument().get(children[idx]);
  };

  this.getChildCount = function() {
    return this[this.getChildrenProperty()].length;
  };

  this.getAddressablePropertyNames = function() {
    return [this.getChildrenProperty()];
  };

};

oo.initClass(ParentNodeMixin);

module.exports = ParentNodeMixin;