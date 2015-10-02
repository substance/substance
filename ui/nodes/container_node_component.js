"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var UnsupporedNode = require('./unsupported_node');

function ContainerNodeComponent() {
  Component.apply(this, arguments);
}

ContainerNodeComponent.Prototype = function() {

  this.render = function() {
    var el = $$("div")
      .addClass("container-node " + this.props.node.id)
      .attr({
        spellCheck: false,
        "data-id": this.props.node.id
      });
    el.append(this.renderComponents());
    return el;
  };

  this.renderComponents = function() {
    var doc = this.props.doc;
    var componentRegistry = this.context.componentRegistry;
    var containerNode = this.props.node;
    return containerNode.nodes.map(function(nodeId) {
      var node = doc.get(nodeId);
      var ComponentClass = componentRegistry.get(node.type);
      if (!ComponentClass) {
        console.error('Could not resolve a component for type: ' + node.type);
        ComponentClass = UnsupporedNode;
      }
      return $$(ComponentClass, {
        doc: doc,
        node: node
      }).ref(node.id);
    });
  };

  this.didMount = function() {
    this.props.doc.connect(this, {
      'document:changed': this.onDocumentChange
    });
    var surface = this.context.surface;
    if (!surface) {
      console.error('No surface context provided. Check parent components');
    }
    surface.attach(this.$el[0]);
  };

  this.willUnmount = function() {
    this.props.doc.disconnect(this);
    this.context.surface.detach();
  };

  this.onDocumentChange = function(change) {
    // TODO: update the DOM element incrementally
    if (change.isAffected([this.props.node.id, 'nodes'])) {
      this.rerender();
    }
  };

};

OO.inherit(ContainerNodeComponent, Component);

module.exports = ContainerNodeComponent;
