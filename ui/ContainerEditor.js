'use strict';

var isString = require('lodash/isString');
var each = require('lodash/each');
var last = require('lodash/last');
var uuid = require('../util/uuid');
var keys = require('../util/keys');
var platform = require('../util/platform');
var EditingBehavior = require('../model/EditingBehavior');
var breakNode = require('../model/transform/breakNode');
var insertNode = require('../model/transform/insertNode');
var switchTextType = require('../model/transform/switchTextType');
var paste = require('../model/transform/paste');
var Surface = require('./Surface');
var RenderingEngine = require('./RenderingEngine');
var IsolatedNodeComponent = require('./IsolatedNodeComponent');

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

function ContainerEditor(parent, props) {
  // default props derived from the given props
  props.containerId = props.containerId || props.node.id;
  props.name = props.name || props.containerId || props.node.id;

  ContainerEditor.super.apply(this, arguments);

  this.containerId = this.props.containerId;
  if (!isString(this.containerId)) {
    throw new Error("Property 'containerId' is mandatory.");
  }
  var doc = this.getDocument();
  this.container = doc.get(this.containerId);
  if (!this.container) {
    throw new Error('Container with id ' + this.containerId + ' does not exist.');
  }

  this.editingBehavior = this.context.editingBehavior || new EditingBehavior();

  // derive internal state variables
  ContainerEditor.prototype._deriveInternalState.call(this, this.props);
}

ContainerEditor.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  this._isContainerEditor = true;

  // Note: this component is self managed
  this.shouldRerender = function() {
    // TODO: we should still detect when the document has changed,
    // see https://github.com/substance/substance/issues/543
    return false;
  };

  this.willReceiveProps = function(newProps) {
    _super.willReceiveProps.apply(this, arguments);
    ContainerEditor.prototype._deriveInternalState.call(this, newProps);
  };

  this.didMount = function() {
    _super.didMount.apply(this, arguments);
    // var doc = this.getDocument();
    // to do incremental updates
    this.container.on('nodes:changed', this.onContainerChange, this);
  };

  this.dispose = function() {
    _super.dispose.apply(this, arguments);
    // var doc = this.getDocument();
    // doc.off(this);
    this.container.off(this);
  };

  this.render = function($$) {
    var el = _super.render.call(this, $$);

    var doc = this.getDocument();
    var containerId = this.getContainerId();
    var containerNode = doc.get(containerId);
    if (!containerNode) {
      console.warn('No container node found for ', containerId);
    }
    el.addClass('sc-container-editor container-node ' + containerId)
      .attr({
        spellCheck: false,
        "data-id": containerId
      });

    if (this.isEmpty()) {
      el.append(
        $$('a').attr('href', '#').append('Start writing').on('click', this.onCreateText)
      );
    } else {
      // node components
      each(containerNode.getNodes(), function(node) {
        el.append(this._renderNode($$, node));
      }.bind(this));
    }

    if (!this.props.disabled) {
      el.addClass('sm-enabled');
      el.setAttribute('contenteditable', true);
    }

    return el;
  };

  this._renderNode = function($$, node) {
    if (!node) throw new Error('Illegal argument');
    if (node.isText()) {
      return _super.renderNode.call(this, $$, node);
    } else {
      var componentRegistry = this.context.componentRegistry;
      var ComponentClass = componentRegistry.get(node.type);
      if (ComponentClass.prototype._isIsolatedNodeComponent) {
        return $$(ComponentClass, { node: node }).ref(node.id);
      } else {
        return $$(IsolatedNodeComponent, { node: node }).ref(node.id);
      }
    }
  };

  this._deriveInternalState = function(props) {
    var _state = this._state;
    if (!props.hasOwnProperty('enabled') || props.enabled) {
      _state.enabled = true;
    } else {
      _state.enabled = false;
    }
  };

  this._handleUpOrDownArrowKey = function (event) {
    event.stopPropagation();
    var direction = (event.keyCode === keys.UP) ? 'left' : 'right';
    var selState = this.getDocumentSession().getSelectionState();
    var sel = selState.getSelection();

    // Note: this collapses the selection, just to let ContentEditable continue doing a cursor move
    if (selState.isFullNodeSelection() && !event.shiftKey) {
      this.domSelection.collapse(direction);
    }
    // HACK: ATM we have a cursor behavior in Chrome and FF when collapsing a selection
    // e.g. have a selection from up-to-down and the press up, seems to move the focus
    else if (!platform.isIE && !sel.isCollapsed() && !event.shiftKey) {
      var doc = this.getDocument();
      if (direction === 'left') {
        this.setSelection(doc.createSelection(sel.start.path, sel.start.offset));
      } else {
        this.setSelection(doc.createSelection(sel.end.path, sel.end.offset));
      }
    }
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we try to map it to the model
    window.setTimeout(function() {
      if (!this.isMounted()) return;
      this._updateModelSelection({ direction: direction });
    }.bind(this));
  };

  this._handleLeftOrRightArrowKey = function (event) {
    event.stopPropagation();
    var direction = (event.keyCode === keys.LEFT) ? 'left' : 'right';
    var selState = this.getDocumentSession().getSelectionState();
    var sel = selState.getSelection();
    // Note: collapsing the selection and let ContentEditable still continue doing a cursor move
    if (selState.isFullNodeSelection() && !event.shiftKey) {
      event.preventDefault();
      this.setSelection(sel.collapse(direction));
      return;
    } else {
      _super._handleLeftOrRightArrowKey.call(this, event);
    }
  };

  this._handleEnterKey = function(event) {
    var selState = this.getDocumentSession().getSelectionState();
    if (selState.isFullNodeSelection()) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      _super._handleEnterKey.apply(this, arguments);
    }
  };

  // Used by Clipboard
  this.isContainerEditor = function() {
    return true;
  };

  /**
    Returns the containerId the editor is bound to
  */
  this.getContainerId = function() {
    return this.containerId;
  };

  // TODO: do we really need this in addition to getContainerId?
  this.getContainer = function() {
    return this.getDocument().get(this.getContainerId());
  };

  this.isEmpty = function() {
    var containerNode = this.getContainer();
    return (containerNode && containerNode.nodes.length === 0);
  };

  this.isEditable = function() {
    return _super.isEditable.call(this) && !this.isEmpty();
  };

  /*
    TODO: Select first content to be found
  */
  this.selectFirst = function() {
    console.warn('TODO: Implement selection of first content to be found.');
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

  // Used by SwitchTextTypeTool
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

  /* Editing behavior */


  /**
    Performs a {@link model/transform/breakNode} transformation
  */
  this.break = function(tx, args) {
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return breakNode(tx, args);
    }
  };

  /**
    Performs an {@link model/transform/insertNode} transformation
  */
  this.insertNode = function(tx, args) {
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return insertNode(tx, args);
    }
  };

  /**
   * Performs a {@link model/transform/switchTextType} transformation
   */
  this.switchType = function(tx, args) {
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
      console.warn('ContainerEditor.selectFirst(): Container is empty.');
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
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return paste(tx, args);
    }
  };

  this.onContainerChange = function(change) {
    var doc = this.getDocument();
    // first update the container
    var renderContext = RenderingEngine.createContext(this);
    var $$ = renderContext.$$;
    var container = this.getContainer();
    var path = container.getContentPath();
    for (var i = 0; i < change.ops.length; i++) {
      var op = change.ops[i];
      if (op.type === "update" && op.path[0] === path[0]) {
        var diff = op.diff;
        if (diff.type === "insert") {
          var nodeId = diff.getValue();
          var node = doc.get(nodeId);
          var nodeEl;
          if (node) {
            nodeEl = this._renderNode($$, node);
          } else {
            // node does not exist anymore
            // so we insert a stub element, so that the number of child
            // elements is consistent
            nodeEl = $$('div');
          }
          this.insertAt(diff.getOffset(), nodeEl);
        } else if (diff.type === "delete") {
          this.removeAt(diff.getOffset());
        }
      }
    }
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

  this.transaction = function(transformation, info) {
    var documentSession = this.documentSession;
    var surfaceId = this.getId();
    var containerId = this.getContainerId();
    return documentSession.transaction(function(tx, args) {
      var sel = tx.before.selection;
      if (sel && !sel.isNull()) {
        sel.containerId = sel.containerId || containerId;
      }
      tx.before.surfaceId = surfaceId;
      args.containerId = this.getContainerId();
      args.editingBehavior = this.editingBehavior;
      var result = transformation(tx, args);
      if (result) {
        sel = result.selection;
        if (sel && !sel.isNull()) {
          sel.containerId = containerId;
        }
        return result;
      }
    }.bind(this), info);
  };

};

Surface.extend(ContainerEditor);

ContainerEditor.static.isContainerEditor = true;

module.exports = ContainerEditor;
