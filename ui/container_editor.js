'use strict';

var OO = require('../basics/oo');
var _ = require('../basics/helpers');
var Surface = require('./surface');
var Component = require('./component');
var UnsupporedNode = require('./nodes/unsupported_node');
var LegacyContainerEditor = require('./surface/container_editor');
var TextPropertyManager = require('../document/text_property_manager');
var $$ = Component.$$;

function ContainerEditor() {
  Surface.apply(this, arguments);

  this.editor = new LegacyContainerEditor(this.props.containerId);
  this.textPropertyManager = new TextPropertyManager(this.props.doc, this.props.containerId);

  this.props.doc.connect(this, {
    'document:changed': this.onDocumentChange
  });
}

ContainerEditor.Prototype = function() {

  this.dispose = function() {
    this.props.doc.disconnect(this);
  };

  this.render = function() {
    var doc = this.props.doc;
    var containerNode = doc.get(this.props.containerId);

    var el = $$("div")
      .addClass("container-node " + containerNode.id)
      .attr({
        spellCheck: false,
        "data-id": containerNode.id,
        "contenteditable": true
      });

    // node components
    _.each(containerNode.nodes, function(nodeId) {
      el.append(this._renderNode(nodeId));
    }, this);

    return el;
  };

  this.onDocumentChange = function(change) {
    if (change.isAffected([this.props.containerId, 'nodes'])) {
      for (var i = 0; i < change.ops.length; i++) {
        var op = change.ops[i];
        if (op.type === "update" && op.path[0] === this.props.containerId) {
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
      ComponentClass = UnsupporedNode;
    }
    return $$(ComponentClass, {
      doc: doc,
      node: node
    });
  };
};

OO.inherit(ContainerEditor, Surface);
module.exports = ContainerEditor;