'use strict';

var each = require('lodash/each');
var Component = require('../../ui/Component');

function ContainerRenderer() {
  Component.apply(this, arguments);

  this.doc = this.context.doc;
  this.componentRegistry = this.context.componentRegistry;
}

ContainerRenderer.Prototype = function() {

  this.render = function($$) {
    var containerNode = this.doc.get(this.props.containerId);
    var el = $$("div")
      .addClass('sc-container-renderer ')
      .attr({
        spellCheck: false,
        "data-id": containerNode.id,
        "contenteditable": false
      });
    // node components
    each(containerNode.nodes, function(nodeId) {
      el.append(this._renderNode($$, nodeId));
    }.bind(this));

    return el;
  };

  this._renderNode = function($$, nodeId) {
    var node = this.doc.get(nodeId);
    var ComponentClass = this.componentRegistry.get(node.type);
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type);
      return $$('div');
    } else {
      return $$(ComponentClass, {
        doc: this.doc,
        node: node
      });
    }
  };

};

Component.extend(ContainerRenderer);

module.exports = ContainerRenderer;