'use strict';

var isString = require('lodash/isString');
var each = require('lodash/each');
var last = require('lodash/last');
var uuid = require('../util/uuid');
var EditingBehavior = require('../model/EditingBehavior');
var insertText = require('../model/transform/insertText');
var copySelection = require('../model/transform/copySelection');
var deleteSelection = require('../model/transform/deleteSelection');
var breakNode = require('../model/transform/breakNode');
var insertNode = require('../model/transform/insertNode');
var switchTextType = require('../model/transform/switchTextType');
var paste = require('../model/transform/paste');
var Surface = require('./Surface');
var RenderingEngine = require('./RenderingEngine');

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

  this.containerId = this.props.containerId;
  if (!isString(this.props.containerId)) {
    throw new Error("Illegal argument: Expecting containerId.");
  }
  var doc = this.getDocument();
  this.container = doc.get(this.containerId);
  if (!this.container) {
    throw new Error('Container with id ' + this.containerId + ' does not exist.');
  }
  this.editingBehavior = new EditingBehavior();
}

ContainerEditor.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  // Note: this component is self managed
  this.shouldRerender = function() {
    // TODO: we should still detect when the document has changed,
    // see https://github.com/substance/substance/issues/543
    return false;
  };

  this.render = function($$) {
    var el = _super.render.apply(this, arguments);

    var doc = this.getDocument();
    var containerId = this.props.containerId;
    var containerNode = doc.get(this.props.containerId);
    if (!containerNode) {
      console.warn('No container node found for ', this.props.containerId);
    }
    var isEditable = this.isEditable();
    el.addClass('sc-container-editor container-node ' + containerId)
      .attr({
        spellCheck: false,
        "data-id": containerId,
        "contenteditable": isEditable
      });

    if (this.isEmpty()) {
      el.append(
        $$('a').attr('href', '#').append('Start writing').on('click', this.onCreateText)
      );
    } else {
      // node components
      each(containerNode.nodes, function(nodeId) {
        el.append(this._renderNode($$, nodeId));
      }.bind(this));
    }

    return el;
  };

  // Used by Clipboard
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

  this.isEmpty = function() {
    var doc = this.getDocument();
    var containerNode = doc.get(this.props.containerId);
    return (containerNode && containerNode.nodes.length === 0);
  };

  this.isEditable = function() {
    return _super.isEditable.call(this) && !this.isEmpty();
  };

  /*
    Register custom editor behavior using this method
  */
  this.extendBehavior = function(extension) {
    extension.register(this.editingBehavior);
  };

  this.getTextTypes = function() {
    return this.textTypes || [];
  };

  // Used by TextTool
  // TODO: Filter by enabled commands for this Surface
  this.getTextCommands = function() {
    var textCommands = {};
    this.commandRegistry.each(function(cmd) {
      if (cmd.constructor.static.textTypeName) {
        textCommands[cmd.getName()] = cmd;
      }
    });
    return textCommands;
  };

  this.enable = function() {
    // As opposed to a ContainerEditor, a regular Surface
    // is not a ContentEditable -- but every contained TextProperty
    this.attr('contentEditable', true);
    this.enabled = true;
  };

  this.disable = function() {
    this.removeAttr('contentEditable');
    this.enabled = false;
  };

  /* Editing behavior */

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
    if (container.nodes.length === 0) {
      return;
    }
    var firstNodeId = container.nodes[0];
    var lastNodeId = last(container.nodes);
    var sel = doc.createSelection({
      type: 'container',
      containerId: container.id,
      startPath: [firstNodeId],
      startOffset: 0,
      endPath: [lastNodeId],
      endOffset: 1
    });
    this.setSelection(sel);
  };

  this.selectFirst = function() {
    var doc = this.getDocument();
    var nodes = this.getContainer().nodes;
    if (nodes.length === 0) {
      console.info('ContainerEditor.selectFirst(): Container is empty.');
      return;
    }
    var node = doc.get(nodes[0]);
    var sel;
    if (node.isText()) {
      sel = doc.createSelection(node.getTextPath(), 0);
    } else {
      sel = doc.createSelection(this.getContainerId(), [node.id], 0, [node.id], 1);
    }
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

  this.onDocumentChange = function(change) {
    // first update the container
    var renderContext = RenderingEngine.createContext(this);
    if (change.isAffected([this.props.containerId, 'nodes'])) {
      for (var i = 0; i < change.ops.length; i++) {
        var op = change.ops[i];
        if (op.type === "update" && op.path[0] === this.props.containerId) {
          var diff = op.diff;
          if (diff.type === "insert") {
            var nodeEl = this._renderNode(renderContext.$$, diff.getValue());
            this.insertAt(diff.getOffset(), nodeEl);
          } else if (diff.type === "delete") {
            this.removeAt(diff.getOffset());
          }
        }
      }
    }
    // do other stuff such as rerendering text properties
    _super.onDocumentChange.apply(this, arguments);
  };

  // Create a first text element
  this.onCreateText = function(e) {
    e.preventDefault();

    var newSel;
    this.transaction(function(tx) {
      var container = tx.get(this.props.containerId);
      var textType = tx.getSchema().getDefaultTextType();
      var node = tx.create({
        id: uuid(textType),
        type: textType,
        content: ''
      });
      container.show(node.id);

      newSel = tx.createSelection({
        type: 'property',
        path: [ node.id, 'content'],
        startOffset: 0,
        endOffset: 0
      });
    }.bind(this));
    this.rerender();
    this.setSelection(newSel);
  };

  this._prepareArgs = function(args) {
    args.containerId = this.getContainerId();
    args.editingBehavior = this.editingBehavior;
  };

};

Surface.extend(ContainerEditor);

module.exports = ContainerEditor;
