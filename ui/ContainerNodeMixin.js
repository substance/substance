'use strict';

var UnsupportedNode = require('./UnsupportedNode');
var Component = require('./Component');
var $$ = Component.$$;

var ContainerNodeMixin = {
  _renderNode: function(nodeId) {
    var doc = this.getDocument();
    var node = doc.get(nodeId);
    var componentRegistry = this.context.componentRegistry || this.props.componentRegistry;
    var ComponentClass = componentRegistry.get(node.type);
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type);
      ComponentClass = UnsupportedNode;
    }
    return $$(ComponentClass, {
      doc: doc,
      node: node
    });
  }
};

module.exports = ContainerNodeMixin;