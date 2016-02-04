'use strict';

var NodeIndex = require('../../model/data/NodeIndex');
var TreeIndex = require('../../util/TreeIndex');

/**
  @class
 */
function MemberIndex(doc) {
  NodeIndex.apply(this, arguments);

  this.doc = doc;
  this.index = new TreeIndex();
}

MemberIndex.Prototype = function() {

  /**
    Selects all nodes which have a parent.

    @private
    @param {model/data/Node}
    @returns {Boolean} true if the given node should be added to the index.
   */
  this.select = function(node) {
    return node.hasParent();
  };

  this._getPath = function(node, parentId) {
    var doc = this.doc;
    parentId = parentId || node.parent;
    var type = node.type;
    var parent = doc.get(parentId);

    if (!parent) {
      console.error('Could not retrieve parent node of member.');
      return [parentId, type, node.name];
    }

    if (parent.type === "class") {
      if (node.isStatic || type === "ctor") {
        return [parentId, 'class', type, node.name];
      } else {
        return [parentId, 'instance', type, node.name];
      }
    } else {
      return [parentId, type, node.name];
    }
  };

  /**
    Called when a node has been created.

    @private
    @param {Node} node
   */
  this.create = function(node) {
    this.index.set(this._getPath(node), node);
  };

  /**
    Called when a node has been deleted.

    @private
    @param {Node} node
   */
  this.delete = function(node) {
    this.index.delete(this._getPath(node));
  };

  /**
    Called when a property has been updated.

    @private
    @param {Node} node
   */
  this.update = function(node, path, newValue, oldValue) {
    if (!this.select(node) || path[1] !== 'parent') return;
    this.index.delete(this._getPath(node, oldValue));
    this.index.set(this._getPath(node, newValue), node);
  };

  this.clone = function() {
    return new MemberIndex(this.doc);
  };

};

NodeIndex.extend(MemberIndex);

module.exports = MemberIndex;
