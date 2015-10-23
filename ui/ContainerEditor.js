'use strict';

var OO = require('../util/oo');
var _ = require('../util/helpers');
var Component = require('./Component');
var FormEditor = require('./FormEditor');
var UnsupportedNode = require('./UnsupportedNode');
var TextPropertyManager = require('../model/TextPropertyManager');
var EditingBehavior = require('../model/EditingBehavior');
var deleteSelection = require('../model/transformations/deleteSelection');
var breakNode = require('../model/transformations/breakNode');
var insertNode = require('../model/transformations/insertNode');
var switchTextType = require('../model/transformations/switchTextType');
var paste = require('../model/transformations/paste');
var $$ = Component.$$;

/**
 * Represents a flow editor that manages a sequence of nodes in a container. Instantiate
 * this editor using `Component.$$` within the render method of a component. Needs to be
 * instantiated within a {@link module:ui/FormEditor} context.
 *
 * @constructor
 * @class
 * @extends module:ui/FormEditor
 * @extends module:ui/Surface
 * @memberof module:ui
 * @example
 *
 * var ContainerEditor = require('substance/ui/ContainerEditor');
 * var Component = require('substance/ui/Component');
 * var ToggleStrong = require('substance/packages/strong/ToggleStrong');
 *
 * var MyEditor = Component.extend({
 *   render: function() {
 *     var editor = $$(ContainerEditor, {
 *     name: 'main',
 *     containerId: 'main',
 *     doc: doc,
 *     commands: [ToggleStrong]
 *     }).ref('editor');
 *     return $$('div').addClass('my-editor').append(editor);
 *   }
 * });
 *
 */

function ContainerEditor() {
  FormEditor.apply(this, arguments);

  if (!_.isString(this.props.containerId)) throw new Error("Illegal argument: Expecting containerId.");

  this.editingBehavior = new EditingBehavior();
  this.textPropertyManager = new TextPropertyManager(this.props.doc, this.props.containerId);

  this.props.doc.connect(this, {
    'document:changed': this.onDocumentChange
  });
}

ContainerEditor.Prototype = function() {

  this.dispose = function() {
    FormEditor.prototype.dispose.call(this);
    this.props.doc.disconnect(this);
  };

  this.render = function() {
    var doc = this.props.doc;
    var containerNode = doc.get(this.props.containerId);

    var el = $$("div")
      .addClass('surface container-node ' + containerNode.id)
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
      ComponentClass = UnsupportedNode;
    }
    return $$(ComponentClass, {
      doc: doc,
      node: node
    });
  };

  /* Editor API */
  this.extendBehavior = function(extension) {
    extension.register(this.editingBehavior);
  };

  // Used by Clipboard
  // TODO: maybe rather check against the class type so we don't need this
  // rather dumb method
  this.isContainerEditor = function() {
    return true;
  };

  this.getContainerId = function() {
    return this.props.containerId;
  };

  // TODO: do we really need this?
  this.getContainer = function() {
    return this.getDocument().get(this.getContainerId());
  };

  /**
   * Performs a `deleteSelection` tr
   */
  this.delete = function(tx, args) {
    this._prepareArgs(args);
    return deleteSelection(tx, args);
  };

  this.break = function(tx, args) {
    this._prepareArgs(args);
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return breakNode(tx, args);
    }
  };

  this.insertNode = function(tx, args) {
    this._prepareArgs(args);
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return insertNode(tx, args);
    }
  };

  this.switchType = function(tx, args) {
    this._prepareArgs(args);
    if (args.selection.isPropertySelection()) {
      return switchTextType(tx, args);
    }
  };

  this.selectAll = function(doc) {
    var container = doc.get(this.containerId);
    var firstPath = container.getFirstPath();
    var lastPath = container.getLastPath();
    var lastText = doc.get(lastPath);
    return doc.createSelection({
      type: 'container',
      containerId: this.containerId,
      startPath: firstPath,
      startOffset: 0,
      endPath: lastPath,
      endOffset: lastText.length
    });
  };

  this.paste = function(tx, args) {
    this._prepareArgs(args);
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return paste(tx, args);
    }
  };

  this._prepareArgs = function(args) {
    args.containerId = this.getContainerId();
    args.editingBehavior = this.editingBehavior;
  };

};

OO.inherit(ContainerEditor, FormEditor);
module.exports = ContainerEditor;