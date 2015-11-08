'use strict';

var oo = require('../util/oo');
var _ = require('../util/helpers');
var Component = require('./Component');
var Surface = require('./Surface');
var TextPropertyManager = require('../model/TextPropertyManager');
var EditingBehavior = require('../model/EditingBehavior');
var insertText = require('../model/transform/insertText');
var copySelection = require('../model/transform/copySelection');
var deleteSelection = require('../model/transform/deleteSelection');
var breakNode = require('../model/transform/breakNode');
var insertNode = require('../model/transform/insertNode');
var switchTextType = require('../model/transform/switchTextType');
var paste = require('../model/transform/paste');
var $$ = Component.$$;

var ContainerNodeMixin = require('./ContainerNodeMixin');

/**
 * Represents a flow editor that manages a sequence of nodes in a container. Instantiate
 * this editor using `Component.$$` within the render method of a component. Needs to be
 * instantiated within a [ui/Controller](ui/Controller) context.
 *
 * @constructor
 * @class
 * @example
 * 
 * ```
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
 * ```
 *
 */

function ContainerEditor() {
  Surface.apply(this, arguments);

  var doc = this.getDocument();

  if (!_.isString(this.props.containerId)) throw new Error("Illegal argument: Expecting containerId.");
  this.editingBehavior = new EditingBehavior();
  this.textPropertyManager = new TextPropertyManager(doc, this.props.containerId);
  
  doc.connect(this, {
    'document:changed': this.onDocumentChange
  });
}

ContainerEditor.Prototype = function() {

  _.extend(this, ContainerNodeMixin.prototype);

  this.dispose = function() {
    Surface.prototype.dispose.call(this);
    var doc = this.getDocument();
    doc.disconnect(this);
  };

  this.render = function() {
    var doc = this.getDocument();
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

  this.selectAll = function() {
    var doc = this.getDocument();
    var container = doc.get(this.getContainerId());
    var firstPath = container.getFirstPath();
    var lastPath = container.getLastPath();
    var lastText = doc.get(lastPath);
    return doc.createSelection({
      type: 'container',
      containerId: container.id,
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

  this.insertText = function(tx, args) {
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return insertText(tx, args);
    }
  };

  this.softBreak = function(tx, args) {
    args.text = "\n";
    return this.insertText(tx, args);
  };

  // create a document instance containing only the selected content
  this.copy = function(doc, selection) {
    var result = copySelection(doc, { selection: selection });
    return result.doc;
  };

};

oo.inherit(ContainerEditor, Surface);
module.exports = ContainerEditor;