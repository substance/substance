'use strict';

var OO = require('../util/oo');
var _ = require('../util/helpers');
var Component = require('./Component');
var $$ = Component.$$;
var UnsupportedNode = require('./UnsupportedNode');
var Surface = require('./Surface');

function ContainerNodeComponent() {
  Component.apply(this, arguments);

  this._renderNode = this._renderNode.bind(this);

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
    var containerNode = this.props.node;

    var el = $$("div")
      .addClass("container-node " + containerNode.id)
      .attr({
        spellCheck: false,
        "data-id": containerNode.id
      });

    // node components
    _.each(containerNode.nodes, function(nodeId) {
      el.append(this._renderNode(nodeId));
    }, this);

    return el;
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

  this.dispose = function() {
    this.props.doc.disconnect(this);
    this.surface.detach();
  };

  this.onDocumentChange = function(change) {
    if (change.isAffected([this.props.node.id, 'nodes'])) {
      for (var i = 0; i < change.ops.length; i++) {
        var op = change.ops[i];
        if (op.type === "update" && op.path[0] === this.props.node.id) {
          var diff = op.diff;
          if (diff.type === "insert") {
            this._insertNodeAt(diff.getOffset(), diff.getValue());
          } else if (diff.type === "delete") {
            this._removeNodeAt(diff.getOffset());
          }
        }
      }
    }
  };

  this._initialize = function() {
    var ctrl = this.context.controller;
    var editor = this.props.editor;
    var options = {
      name: this.props.node.id,
      logger: ctrl.getLogger(),
      commands: this.props.commands
    };

    this.surface = new Surface(ctrl, editor, options);
  };

  this._insertNodeAt = function(pos, nodeId) {
    var comp = this._renderNode(nodeId);
    this.insertAt(pos, comp);
  };

  this._removeNodeAt = function(pos) {
    this.removeAt(pos);
  };

  this._renderNode = function(nodeId) {
    var doc = this.props.doc;
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

OO.inherit(ContainerNodeComponent, Component);

module.exports = ContainerNodeComponent;
