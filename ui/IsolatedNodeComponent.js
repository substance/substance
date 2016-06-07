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
    selectionFragment: null,
    level: this._getLevel()
  };
}

IsolatedNodeComponent.Prototype = function() {

  var _super = IsolatedNodeComponent.super.prototype;

  this._isIsolatedNodeComponent = true;

  this.getChildContext = function() {
    return {
      surfaceParent: this
    };
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
    // console.log('##### IsolatedNodeComponent.render()', $$.capturing);
    var el = _super.render.apply(this, arguments);
    var ContentClass = this._getContentClass() || Component;

    var node = this.props.node;
    el.addClass('sc-isolated-node')
      .addClass('sm-'+this.props.node.type)
      .attr("data-id", node.id);

    if (this.state.mode) {
      el.addClass('sm-'+this.state.mode);
    } else {
      el.addClass('sm-not-selected');
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
      $$('div').addClass('se-slug').addClass('sm-before').ref('before')
        // NOTE: better use a regular character otherwise Edge has problems
        .append("{")
    );

    var container = $$('div').addClass('se-container')
      .attr('contenteditable', false);

    if (ContentClass.static.fullWidth) {
      container.addClass('sm-full-width');
    }

    if (this.state.mode === 'cursor' && this.state.position === 'before') {
      container.append(
        $$('div').addClass('se-cursor').addClass('sm-before').attr('contenteditable', false)
      );
    }
    container.append(this.renderContent($$));

    if (this._isDisabled()) {
      container.addClass('sm-disabled');
      // NOTE: there are some content implementations which work better without a blocker
      var blocker = $$('div').addClass('se-blocker').css({ 'z-index': this._state.level });
      container.append(blocker);
    }

    if (this.state.mode === 'cursor' && this.state.position === 'after') {
      container.append(
        $$('div').addClass('se-cursor').addClass('sm-after').attr('contenteditable', false)
      );
    }

    el.append(container);

    el.append(
      $$('div').addClass('se-slug').addClass('sm-after').ref('after')
        // NOTE: better use a regular character otherwise Edge has problems
        .append("}")
    );

    return el;
  };

  this.renderContent = function($$) {
    var node = this.props.node;
    var ComponentClass = this._getContentClass();
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type);
      return $$('div');
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

  this._getContentClass = function() {
    var node = this.props.node;
    var componentRegistry = this.context.componentRegistry;
    var ComponentClass = componentRegistry.get(node.type);
    return ComponentClass;
  };

  this._isDisabled = function() {
    return this.state.mode === 'co-selected' || this.state.mode === 'cursor' || !this.state.mode;
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
      var newState = this._deriveStateFromSelection(update.selection);
      if (!newState && this.state.mode) {
        this.setState({});
      } else if (newState && newState.mode !== this.state.mode) {
        this.setState(newState);
      }
    }
  };

  this._deriveStateFromSelection = function(sel) {
    var surfaceId = sel.surfaceId;
    if (!surfaceId) return;
    var id = this.getId();
    var nodeId = this.props.node.id;
    var parentId = this._getSurfaceParent().getId();
    var inParentSurface = (surfaceId === parentId);
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (inParentSurface) {
      if (sel.isNodeSelection() && sel.getNodeId() === nodeId && sel.isEntireNodeSelected()) {
        return {
          mode: 'selected'
        };
      }
      if (sel.isContainerSelection() && sel.containsNodeFragment(nodeId)) {
        return {
          mode: 'co-selected'
        };
      }
      var hasCursor = (inParentSurface &&
        sel.isContainerSelection() &&
        sel.isCollapsed() &&
        sel.startPath.length === 1 &&
        sel.startPath[0] === nodeId
      );
      if (hasCursor) {
        return {
          mode: 'cursor',
          position: sel.startOffset === 0 ? 'before' : 'after'
        };
      }
      return;
    }
    // for all other cases (focused / co-focused) the surface id prefix must match
    if (!startsWith(surfaceId, id)) return;

    if (surfaceId.length === id.length) {
      return {
        mode: 'focused'
      };
    } else {
      return {
        mode: 'co-focused'
      };
    }
  };

  this.onMousedown = function(event) {
    // console.log('IsolatedNodeComponent.onMousedown', this.getId());
    event.stopPropagation();
    switch (this.state.mode) {
      case 'selected':
      case 'focused':
      case 'co-focused':
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
      this._selectNode();
      this.setState({ mode: 'selected' });
    }
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
      type: 'container',
      containerId: surface.getContainerId(),
      startPath: [nodeId],
      startOffset: 0,
      endPath: [nodeId],
      endOffset: 1
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
      var charPos = 0;
      if (boundary.is('sm-after')) {
        charPos = 1;
      }
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

module.exports = IsolatedNodeComponent;
