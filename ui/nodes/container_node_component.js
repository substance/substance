"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var UnsupporedNode = require('./unsupported_node');
var Surface = require('../../surface');

function ContainerNodeComponent() {
  Component.apply(this, arguments);

  // calling this here for initialization
  this._initialize();
}

ContainerNodeComponent.Prototype = function() {

  this.getChildContext = function() {
    return {
      surface: this.surface
    };
  };

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
    var containerNode = this.props.node;
    var componentRegistry = this.context.componentRegistry;
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

  this.willReceiveProps = function(newProps) {
    if (this.props.doc && this.props.doc !== newProps.doc) {
      this.surface.detach();
    }
  };

  this.didReceiveProps = function() {
    this._initialize();
  };

  this.didMount = function() {
    this.props.doc.connect(this, {
      'document:changed': this.onDocumentChange
    });
    this.surface.attach(this.$el[0]);
  };

  this.willUnmount = function() {
    this.props.doc.disconnect(this);
    this.surface.detach();
  };

  this.onDocumentChange = function(change) {
    // TODO: update the DOM element incrementally
    if (change.isAffected([this.props.node.id, 'nodes'])) {
      this.rerender();
    }
  };

  this._initialize = function() {
    var doc = this.props.doc;
    var editor = this.props.editor;
    var options = {
      name: this.props.node.id,
      logger: this.context.notifications
    };
    this.surface = new Surface(this.context.surfaceManager, doc, editor, options);
  };
};

OO.inherit(ContainerNodeComponent, Component);

module.exports = ContainerNodeComponent;
