'use strict';

var UnsupportedNode = require('./UnsupportedNode');
var Component = require('./Component');
var oo = require('../util/oo');
var $$ = Component.$$;

/*
  Mix-in for container node components  
*/

function ContainerNodeMixin() {
  
}

ContainerNodeMixin.Prototype = function() {
  this._renderNode = function(nodeId) {
    var doc = this.context.doc;
    var node = doc.get(nodeId);
    var componentRegistry = this.context.componentRegistry;
    var ComponentClass = componentRegistry.get(node.type);
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type);
      ComponentClass = UnsupportedNode;
    }
    return $$(ComponentClass, {
      doc: doc,
      node: node
    });
  };
};

oo.initClass(ContainerNodeMixin);

module.exports = ContainerNodeMixin;