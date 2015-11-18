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
function ParentNodeMixin(childrenProperty) {
  this._childrenProperty = childrenProperty;
}

ParentNodeMixin.Prototype = function() {

  this.hasChildren = function() {
    return true;
  };

  this.getChildIndex = function(child) {
    return this[this._childrenProperty].indexOf(child.id);
  };

  this.getChildAt = function(idx) {
    return this.getDocument().get(this[this._childrenProperty][idx]);
  };

  this.getChildCount = function() {
    return this[this._childrenProperty].length;
  };

  this.getAddressablePropertyNames = function() {
    return [this._childrenProperty];
  };

};

oo.initClass(ParentNodeMixin);

module.exports = ParentNodeMixin;