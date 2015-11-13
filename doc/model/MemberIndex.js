
var oo = require('../../util/oo');
var NodeIndex = require('../../model/data/NodeIndex');
var PathAdapter = require('../../util/PathAdapter');

/**
  @class
 */
function MemberIndex() {
  NodeIndex.apply(this, arguments);

  this.index = new PathAdapter();
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

  function _getPath(node, parentId) {
    var parentId = parentId || node.parent;
    var type = node.type;

    if (node.isStatic) {
      return [parentId, 'class', type, node.name];
    } else {
      return [parentId, 'instance', type, node.name];
    }
  };

  /**
    Called when a node has been created.

    @private
    @param {Node} node
   */
  this.create = function(node) {
    this.index.set(_getPath(node), node);
  };

  /**
    Called when a node has been deleted.

    @private
    @param {Node} node
   */
  this.delete = function(node) {
    this.index.delete(_getPath(node));
  };

  /**
    Called when a property has been updated.

    @private
    @param {Node} node
   */
  this.update = function(node, path, newValue, oldValue) {
    if (!this.select(node) || path[1] !== 'parent') return;
    this.index.delete(_getPath(node, oldValue));
    this.index.set(_getPath(node, newValue), node);
  };

};

oo.inherit(MemberIndex, NodeIndex);

module.exports = MemberIndex;
