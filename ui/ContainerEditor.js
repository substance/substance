'use strict';

var _ = require('../util/helpers');
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
var uuid = require('../util/uuid');
var ContainerNodeMixin = require('./ContainerNodeMixin');
var Component = require('./Component');
var $$ = Component.$$;

/**
  Represents a flow editor that manages a sequence of nodes in a container. Needs to be
  instantiated inside a {@link ui/Controller} context.

  @class ContainerEditor
  @component
  @extends ui/Surface

  @prop {String} name unique editor name
  @prop {String} containerId container id
  @prop {Object[]} textTypes array of textType definition objects
  @prop {ui/SurfaceCommand[]} commands array of command classes to be available

  @example

  Create a full-fledged `ContainerEditor` for the `body` container of a document.
  Allow Strong and Emphasis annotations and to switch text types between paragraph
  and heading at level 1.

  ```js
  $$(ContainerEditor, {
    name: 'bodyEditor',
    containerId: 'body',
    textTypes: [
      {name: 'paragraph', data: {type: 'paragraph'}},
      {name: 'heading1',  data: {type: 'heading', level: 1}}
    ],
    commands: [StrongCommand, EmphasisCommand, SwitchTextTypeCommand],
  })
  ```
 */

function ContainerEditor() {
  Surface.apply(this, arguments);
  if (!_.isString(this.props.containerId)) throw new Error("Illegal argument: Expecting containerId.");

  var doc = this.getDocument();

  this.editingBehavior = new EditingBehavior();
  this.textPropertyManager = new TextPropertyManager(doc, this.props.containerId);

  doc.connect(this, {
    'document:changed': this.onDocumentChange
  });
}

ContainerEditor.Prototype = function() {

  // Create a first text element
  this.onCreateText = function() {
    this.transaction(function(tx) {
      var container = tx.get(this.props.containerId);
      var textType = tx.getSchema().getDefaultTextType();
      var node = tx.create({
        id: uuid(textType),
        type: textType,
        content: 'Start writing'
      });
      container.show(node.id);
    }.bind(this));
    this.rerender();
  };

  this.isEmpty = function() {
    var doc = this.getDocument();
    var containerNode = doc.get(this.props.containerId);
    return (containerNode && containerNode.nodes.length === 0);
  };

  this.shouldEnableSurface = function() {
    return !this.isEmpty();
  };

  this.render = function() {
    var el = Surface.prototype.render.call(this);

    var doc = this.getDocument();
    var containerId = this.props.containerId;
    var containerNode = doc.get(this.props.containerId);
    if (!containerNode) {
      console.warn('No container node found for ', this.props.containerId);
    }
    var isEmpty = this.isEmpty();

    el.addClass('sc-container-editor container-node ' + containerId)
      .attr({
        spellCheck: false,
        "data-id": containerId,
        "contenteditable": !isEmpty
      });

    if (isEmpty) {
      el.append(
        $$('a').attr('href', '#').append('Create text').on('click', this.onCreateText)
      );
    } else {
      // node components
      _.each(containerNode.nodes, function(nodeId) {
        el.append(this._renderNode(nodeId));
      }, this);
    }

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

  /**
    Register custom editor behavior using this method
  */
  this.extendBehavior = function(extension) {
    extension.register(this.editingBehavior);
  };

  // Used by Clipboard
  // TODO: maybe rather check against the class type so we don't need this
  // rather dumb method
  this.isContainerEditor = function() {
    return true;
  };

  /**
    Returns the containerId the editor is bound to
  */
  this.getContainerId = function() {
    return this.props.containerId;
  };

  // TODO: do we really need this in addition to getContainerId?
  this.getContainer = function() {
    return this.getDocument().get(this.getContainerId());
  };

  /**
    Performs a {@link model/transform/deleteSelection} transformation
  */
  this.delete = function(tx, args) {
    this._prepareArgs(args);
    return deleteSelection(tx, args);
  };

  /**
    Performs a {@link model/transform/breakNode} transformation
  */
  this.break = function(tx, args) {
    this._prepareArgs(args);
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return breakNode(tx, args);
    }
  };

  /**
    Performs an {@link model/transform/insertNode} transformation
  */
  this.insertNode = function(tx, args) {
    this._prepareArgs(args);
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return insertNode(tx, args);
    }
  };

  /**
   * Performs a {@link model/transform/switchTextType} transformation
   */
  this.switchType = function(tx, args) {
    this._prepareArgs(args);
    if (args.selection.isPropertySelection()) {
      return switchTextType(tx, args);
    }
  };

  /**
    Selects all content in the container
  */
  this.selectAll = function() {
    var doc = this.getDocument();
    var container = doc.get(this.getContainerId());
    var firstPath = container.getFirstPath();
    var lastPath = container.getLastPath();
    var lastText = doc.get(lastPath);
    var sel = doc.createSelection({
      type: 'container',
      containerId: container.id,
      startPath: firstPath,
      startOffset: 0,
      endPath: lastPath,
      endOffset: lastText.length
    });
    this.setSelection(sel);
  };

  /**
    Performs a {@link model/transform/paste} transformation
  */
  this.paste = function(tx, args) {
    this._prepareArgs(args);
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return paste(tx, args);
    }
  };

  /**
    Performs an {@link model/transform/insertText} transformation
  */
  this.insertText = function(tx, args) {
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return insertText(tx, args);
    }
  };

  /**
    Inserts a soft break
  */
  this.softBreak = function(tx, args) {
    args.text = "\n";
    return this.insertText(tx, args);
  };

  /**
    Copy the current selection. Performs a {@link model/transform/copySelection}
    transformation.
  */
  this.copy = function(doc, selection) {
    var result = copySelection(doc, { selection: selection });
    return result.doc;
  };

  this._prepareArgs = function(args) {
    args.containerId = this.getContainerId();
    args.editingBehavior = this.editingBehavior;
  };

  this._insertNodeAt = function(pos, nodeId) {
    var comp = this._renderNode(nodeId);
    this.insertAt(pos, comp);
  };

  this._removeNodeAt = function(pos) {
    this.removeAt(pos);
  };
};

Surface.extend(ContainerEditor, ContainerNodeMixin);

module.exports = ContainerEditor;
