'use strict';

var oo = require('../../util/oo');
var _ = require('../../util/helpers');
var Component = require('../../ui/Component');
var UnsupportedNode = require('../../ui/UnsupportedNode');
var $$ = Component.$$;

function ContainerRenderer() {
  Component.apply(this, arguments);
}

ContainerRenderer.Prototype = function() {

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

  this.render = function() {
    var doc = this.context.doc;
    var containerNode = doc.get(this.props.containerId);

    var el = $$("div")
      .addClass('sc-container-renderer ')
      .attr({
        spellCheck: false,
        "data-id": containerNode.id,
        "contenteditable": false
      });

    // node components
    _.each(containerNode.nodes, function(nodeId) {
      el.append(this._renderNode(nodeId));
    }, this);

    return el;
  };

};

oo.inherit(ContainerRenderer, Component);
module.exports = ContainerRenderer;