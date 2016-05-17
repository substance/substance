'use strict';

var error = require('../util/error');
var keys = require('../util/keys');
var inBrowser = require('../util/inBrowser');
var Coordinate = require('../model/Coordinate');
var Component = require('./Component');
var DefaultDOMElement = require('./DefaultDOMElement');

function IsolatedNodeComponent() {
  IsolatedNodeComponent.super.apply(this, arguments);

  this.name = this.props.node.id;
  this._id = _createId(this);
  this._state = {
    selectionFragment: null
  };
}

function _createId(isolatedNodeComp) {
  var surfaceParent = isolatedNodeComp.getSurfaceParent();
  if (surfaceParent) {
    return surfaceParent.getId() + '/' + isolatedNodeComp.name;
  } else {
    return isolatedNodeComp.name;
  }
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

    this._registerGlobalDOMHandlers();
  };

  this.willReceiveProps = function() {
    _super.willReceiveProps.apply(this, arguments);
    this._unregisterGlobalDOMHandlers();
  };

  this.didUpdate = function() {
    this._registerGlobalDOMHandlers();
  };

  this.dispose = function() {
    _super.dispose.call(this);

    var docSession = this.context.documentSession;
    docSession.off(this);

    this._unregisterGlobalDOMHandlers();
  };

  this.render = function($$) {
    // console.log('##### IsolatedNodeComponent.render()', $$.capturing);
    var el = _super.render.apply(this, arguments);

    var node = this.props.node;
    el.addClass('sc-isolated-node')
      .attr("data-id", node.id);

    if (this.state.mode) {
      el.addClass('sm-'+this.state.mode);
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

    if (this.state.mode === 'cursor' && this.state.position === 'before') {
      container.append(
        $$('div').addClass('se-cursor').addClass('sm-before').attr('contenteditable', false)
      );
    }
    container.append(this.renderContent($$));

    // TODO: there are some content implementations which would work better without that
    // i.e. having such an overlay here
    if (this._isDisabled()) {
      container.addClass('sm-disabled');
      container.append($$('div').addClass('se-blocker'));
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
    var componentRegistry = this.context.componentRegistry;
    var ComponentClass = componentRegistry.get(node.type);
    if (!ComponentClass) {
      error('Could not resolve a component for type: ' + node.type);
      return $$('div');
    } else {
      var props = {
        node: node,
        disabled: this._isDisabled()
      };
      return $$(ComponentClass, props).ref('content');
    }
  };

  this._registerGlobalDOMHandlers = function() {
    if (inBrowser && this.state.mode === 'focused') {
      var documentEl = DefaultDOMElement.wrapNativeElement(window.document);
      documentEl.on('keydown', this.onKeydown, this);
    }
  };

  this._unregisterGlobalDOMHandlers = function() {
    if (inBrowser) {
      var documentEl = DefaultDOMElement.wrapNativeElement(window.document);
      documentEl.off(this, 'keydown');
    }
  };

  this._isDisabled = function() {
    return this.state.mode === 'selected' || this.state.mode === 'cursor' || !this.state.mode;
  };

  this.getId = function() {
    return this._id;
  };

  this.getSurfaceParent = function() {
    return this.context.surface;
  };

  this.onSessionUpdate = function(update) {
    if (update.selection) {
      // TODO: we need to change the DocumentSession update API
      // as it is important to know the old and new value
      var newSel = update.selection;
      var surfaceId = newSel.surfaceId;

      if (this.state.mode === 'focused') {
        if (surfaceId && !surfaceId.startsWith(this._id)) {
          this.setState({ mode: null });
          return;
        }
      } else {
        var nodeId = this.props.node.id;
        var inSurface = (surfaceId === this.getSurfaceParent().getId());
        var nodeIsSelected = (inSurface &&
          newSel.isContainerSelection() && newSel.containsNodeFragment(nodeId)
        );
        // TODO: probably we need to dispatch the state to descendants
        if (this.state.mode !== 'selected' && nodeIsSelected) {
          // console.log('IsolatedNodeComponent: detected node selection.');
          this.setState({ mode: 'selected' });
          return;
        }
        var hasCursor = (inSurface &&
          newSel.isContainerSelection() &&
          newSel.isCollapsed() &&
          newSel.startPath.length === 1 &&
          newSel.startPath[0] === nodeId
        );
        if (this.state.mode !== 'cursor' && hasCursor) {
          // console.log('IsolatedNodeComponent: detected cursor.');
          this.setState({ mode: 'cursor', position: newSel.startOffset === 0 ? 'before' : 'after' });
          return;
        }
        if (this.state.mode === 'selected' && !nodeIsSelected) {
          this.setState({ mode: null });
          return;
        }
        if (this.state.mode === 'cursor' && !hasCursor) {
          this.setState({ mode: null });
          return;
        }
      }
    }
  };

  this.onMousedown = function(event) {
    // console.log('IsolatedNodeComponent.onMousedown');
    event.stopPropagation();
    switch (this.state.mode) {
      case 'selected':
        event.preventDefault();
        this.setState({ mode: 'focused' });
        break;
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
    console.log('####', event.keyCode, event.metaKey, event.ctrlKey, event.shiftKey);
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
    console.log('IsolatedNodeComponent: selecting node.');
    var surface = this.context.surface;
    var doc = surface.getDocument();
    var node = this.props.node;
    surface.setSelection(doc.createSelection({
      type: 'container',
      containerId: surface.getContainerId(),
      startPath: [node.id],
      startOffset: 0,
      endPath: [node.id],
      endOffset: 1
    }));
    this.el.focus();
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
      error('FIXME: expecting a data-id attribute on IsolatedNodeComponent');
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
