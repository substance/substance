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

  this.render = function($$) {
    var node = this.props.node;
    // console.log('##### IsolatedNodeComponent.render()', $$.capturing);
    var el = _super.render.apply(this, arguments);
    el.tagName = this.__elementTag;

    var ContentClass = this._getContentClass(node) || Component;

    el.addClass('sc-isolated-node')
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

    if (this._isDisabled() || this.state.mode === 'co-focused') {
      container.addClass('sm-disabled');
      // NOTE: there are some content implementations which work better without a blocker
      var blocker = $$(this.__elementTag).addClass('se-blocker')
        .css({ 'z-index': 2*level+1 });
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
    var ComponentClass = this._getContentClass(node);
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type);
      return $$(this.__elementTag);
    } else {
      var props = {
        node: node,
        disabled: this._isDisabled()
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

  this._getContentClass = function(node) {
    var componentRegistry = this.context.componentRegistry;
    var ComponentClass = componentRegistry.get(node.type);
    return ComponentClass;
  };

  this._isDisabled = function() {
    return !this.state.mode || ['co-selected', 'cursor'].indexOf(this.state.mode) > -1;
  };

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
    // for all other cases (focused / co-focused) the surface id prefix must match
    if (!startsWith(surfaceId, id)) return;

    // Note: trying to distinguisd focused
    // surfaceIds are a sequence of names joined with '/'
    // a surface inside this node will have a path with length+1.
    // a custom selection might just use the id of this IsolatedNode
    var p1 = id.split('/');
    var p2 = surfaceId.split('/');
    if (p2.length >= p1.length && p2.length <= p1.length+1) {
      return { mode: 'focused' };
    } else {
      return { mode: 'co-focused' };
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
