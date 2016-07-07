'use strict';

var startsWith = require('lodash/startsWith');
var keys = require('../util/keys');
var createSurfaceId = require('../util/createSurfaceId');
var Coordinate = require('../model/Coordinate');
var Component = require('./Component');

function IsolatedNodeComponent() {
  IsolatedNodeComponent.super.apply(this, arguments);

  this.name = this.props.node.id;
  this._id = createSurfaceId(this);
  this._state = {
    selectionFragment: null
  };

  this.handleAction('escape', this._escape);
  this.ContentClass = this._getContentClass(this.props.node) || Component;
}

IsolatedNodeComponent.Prototype = function() {

  var _super = IsolatedNodeComponent.super.prototype;

  this._isIsolatedNodeComponent = true;

  // InlineNode uses 'span'
  this.__elementTag = 'div';
  this.__slugChar = "|";

  this.getChildContext = function() {
    return {
      surfaceParent: this
    };
  };

  this.getInitialState = function() {
    var selState = this.context.documentSession.getSelectionState();
    return this._deriveStateFromSelectionState(selState);
  };

  this.didMount = function() {
    _super.didMount.call(this);

    var docSession = this.context.documentSession;
    docSession.on('update', this.onSessionUpdate, this);
  };

  this.dispose = function() {
    _super.dispose.call(this);

    var docSession = this.context.documentSession;
    docSession.off(this);
  };

  this.getClassNames = function() {
    return 'sc-isolated-node';
  };

  this.render = function($$) {
    var node = this.props.node;
    var ContentClass = this.ContentClass;
    // console.log('##### IsolatedNodeComponent.render()', $$.capturing);
    var el = _super.render.apply(this, arguments);
    el.tagName = this.__elementTag;
    el.addClass(this.getClassNames())
      .addClass('sm-'+this.props.node.type)
      .attr("data-id", node.id);

    if (this.state.mode) {
      el.addClass('sm-'+this.state.mode);
    } else {
      el.addClass('sm-not-selected');
    }

    if (!ContentClass.static.noStyle) {
      el.addClass('sm-default-style');
    }

    el.on('mousedown', this.onMousedown);
    // shadowing handlers of the parent surface
    // TODO: extract this into a helper so that we can reuse it anywhere where we want
    // to prevent propagation to the parent surface
    el.on('keydown', this.onKeydown)
      .on('keypress', this._stopPropagation)
      .on('keyup', this._stopPropagation)
      .on('compositionstart', this._stopPropagation)
      .on('textInput', this._stopPropagation);

    if (this.context.dragManager) {
      el.on('dragstart', this.onDragstart);
      el.on('drop', this.onDrop);
    }

    el.append(
      $$(this.__elementTag).addClass('se-slug').addClass('sm-before').ref('before')
        // NOTE: better use a regular character otherwise Edge has problems
        .append(this.__slugChar)
    );

    var level = this._getLevel();


    var container = $$(this.__elementTag).addClass('se-container')
      .attr('contenteditable', false)
      .css({ 'z-index': 2*level });

    if (ContentClass.static.fullWidth) {
      container.addClass('sm-full-width');
    }

    if (this.state.mode === 'cursor' && this.state.position === 'before') {
      container.append(
        $$(this.__elementTag).addClass('se-cursor').addClass('sm-before').attr('contenteditable', false)
      );
    }
    container.append(this.renderContent($$, node));

    if (this.isDisabled()) {
      container.addClass('sm-disabled');
      // NOTE: there are some content implementations which work better without a blocker
      var blocker = $$(this.__elementTag).addClass('se-blocker')
        .css({ 'z-index': 2*level+1 })
        .attr("draggable", true)
        .on('dragstart', this.onDragstart);
      container.append(blocker);
    }

    if (this.state.mode === 'cursor' && this.state.position === 'after') {
      container.append(
        $$(this.__elementTag).addClass('se-cursor').addClass('sm-after').attr('contenteditable', false)
      );
    }

    el.append(container);

    el.append(
      $$(this.__elementTag).addClass('se-slug').addClass('sm-after').ref('after')
        // NOTE: better use a regular character otherwise Edge has problems
        .append(this.__slugChar)
    );

    return el;
  };

  this.renderContent = function($$, node) {
    var ComponentClass = this.ContentClass;
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type);
      return $$(this.__elementTag);
    } else {
      var props = {
        node: node,
        disabled: this.isDisabled(),
        isolatedNodeState: this.state.mode
      };
      if (this.state.mode === 'focused') {
        props.focused = true;
      }
      return $$(ComponentClass, props).ref('content');
    }
  };

  this.getId = function() {
    return this._id;
  };

  this.getMode = function() {
    return this.state.mode;
  };

  this.isNotSelected = function() {
    return !this.state.mode;
  };

  this.isSelected = function() {
    return this.state.mode === 'selected';
  };

  this.isCoSelected = function() {
    return this.state.mode === 'co-selected';
  };

  this.isFocused = function() {
    return this.state.mode === 'focused';
  };

  this.isCoFocused = function() {
    return this.state.mode === 'co-focused';
  };

  this._getContentClass = function(node) {
    var componentRegistry = this.context.componentRegistry;
    var ComponentClass = componentRegistry.get(node.type);
    return ComponentClass;
  };

  this.isDisabled = function() {
    return !this.state.mode || ['co-selected', 'cursor'].indexOf(this.state.mode) > -1;
  };

  this._isDisabled = this.isDisabled;

  this._getSurfaceParent = function() {
    return this.context.surface;
  };

  this._getLevel = function() {
    var level = 1;
    var parent = this._getSurfaceParent();
    while (parent) {
      level++;
      parent = parent._getSurfaceParent();
    }
    return level;
  };

  this.onSessionUpdate = function(update) {
    if (update.selection) {
      var documentSession = this.context.documentSession;
      var newState = this._deriveStateFromSelectionState(documentSession.getSelectionState());
      if (!newState && this.state.mode) {
        this.setState({});
      } else if (newState && newState.mode !== this.state.mode) {
        this.setState(newState);
      }
    }
  };

  this._deriveStateFromSelectionState = function(selState) {
    var sel = selState.getSelection();
    var surfaceId = sel.surfaceId;
    if (!surfaceId) return;
    var id = this.getId();
    var nodeId = this.props.node.id;
    var parentId = this._getSurfaceParent().getId();
    var inParentSurface = (surfaceId === parentId);
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (inParentSurface) {
      if (sel.isNodeSelection() && sel.getNodeId() === nodeId) {
        if (sel.isFull()) {
          return { mode: 'selected' };
        } else if (sel.isBefore()) {
          return { mode: 'cursor', position: 'before' };
        } else if (sel.isAfter()) {
          return { mode: 'cursor', position: 'after' };
        }
      }
      if (sel.isContainerSelection() && sel.containsNodeFragment(nodeId)) {
        return { mode: 'co-selected' };
      }
      return;
    }
    if (sel.isCustomSelection() && id === surfaceId) {
      return { mode: 'focused' };
    }
    // HACK: a looks a bit hacky. Fine for now.
    // TODO: we should think about switching to surfacePath, instead of surfaceId
    else if (startsWith(surfaceId, id)) {
      var path1 = id.split('/');
      var path2 = surfaceId.split('/');
      var len1 = path1.length;
      var len2 = path2.length;
      if (len2 > len1 && path1[len1-1] === path2[len1-1]) {
        if (len2 === len1 + 1) {
          return { mode: 'focused' };
        } else {
          return { mode: 'co-focused' };
        }
      } else {
        return null;
      }
    }
  };

  this.onMousedown = function(event) {
    // console.log('IsolatedNodeComponent.onMousedown', this.getId());
    event.stopPropagation();
    switch (this.state.mode) {
      case 'selected':
      case 'focused':
        break;
      default:
        event.preventDefault();
        this._selectNode();
        this.setState({ mode: 'selected' });
    }
  };

  this.onKeydown = function(event) {
    event.stopPropagation();
    // console.log('####', event.keyCode, event.metaKey, event.ctrlKey, event.shiftKey);
    // TODO: while this works when we have an isolated node with input or CE,
    // there is no built-in way of receiving key events in other cases
    // We need a global event listener for keyboard events which dispatches to the current isolated node
    if (event.keyCode === keys.ESCAPE && this.state.mode === 'focused') {
      event.preventDefault();
      this._escape();
    }
  };

  this.onDragstart = function(event) {
    // console.log('Start dragging on', this.getId());
    this.context.dragManager.onDragstart(event);
  };

  this.onDrop = function(event) {
    // console.log('Received drop on IsolatedNode', this.getId());
    this.context.dragManager.onDrop(event);
  };

  this._escape = function() {
    this._selectNode();
    // TODO: Is this still necessary?
    // The state should be set during the next update cycle.
    this.setState({ mode: 'selected' });
  };

  this._stopPropagation = function(event) {
    event.stopPropagation();
  };

  this._selectNode = function() {
    // console.log('IsolatedNodeComponent: selecting node.');
    var surface = this.context.surface;
    var doc = surface.getDocument();
    var nodeId = this.props.node.id;
    surface.setSelection(doc.createSelection({
      type: 'node',
      containerId: surface.getContainerId(),
      nodeId: nodeId,
      mode: 'full'
    }));
  };

};

Component.extend(IsolatedNodeComponent);

IsolatedNodeComponent.getCoordinate = function(surfaceEl, node) {
  // special treatment for block-level isolated-nodes
  var parent = node.getParent();
  if (node.isTextNode() && parent.is('.se-slug')) {
    var boundary = parent;
    var isolatedNodeEl = boundary.getParent();
    var nodeId = isolatedNodeEl.getAttribute('data-id');
    if (nodeId) {
      var charPos = boundary.is('sm-after') ? 1 : 0;
      return new Coordinate([nodeId], charPos);
    } else {
      console.error('FIXME: expecting a data-id attribute on IsolatedNodeComponent');
    }
  }
  return null;
};

IsolatedNodeComponent.getDOMCoordinate = function(comp, coor) {
  var domCoor;
  if (coor.offset === 0) {
    domCoor = {
      container: comp.refs.before.getNativeElement(),
      offset: 0
    };
  } else {
    domCoor = {
      container: comp.refs.after.getNativeElement(),
      offset: 1
    };
  }
  return domCoor;
};

IsolatedNodeComponent.getDOMCoordinates = function(comp) {
  return {
    start: {
      container: comp.refs.before.getNativeElement(),
      offset: 0
    },
    end: {
      container: comp.refs.after.getNativeElement(),
      offset: 1
    }
  };
};

module.exports = IsolatedNodeComponent;
