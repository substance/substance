'use strict';

var isEqual = require('lodash/isEqual');
var startsWith = require('lodash/startsWith');
var IsolatedNodeComponent = require('./IsolatedNodeComponent');
var InlineWrapperComponent = require('./InlineWrapperComponent');

function InlineNodeComponent() {
  InlineNodeComponent.super.apply(this, arguments);
}

InlineNodeComponent.Prototype = function() {

  var _super = InlineNodeComponent.super.prototype;

  // use spans everywhere
  this.__elementTag = 'span';
  this.__slugChar = "\uFEFF";

  this.render = function($$) { // eslint-disable-line
    var el = _super.render.apply(this, arguments);
    el.addClass('sc-inline-node')
      .removeClass('sc-isolated-node')
      .attr("data-id", this.props.node.id)
      .attr('data-inline', '1');

    return el;
  };

  this._getContentClass = function(node) {
    if (node.type === 'inline-wrapper') {
      return InlineWrapperComponent;
    } else {
      return _super._getContentClass.call(this, node);
    }
  };

  this._deriveStateFromSelection = function(sel) {
    var surfaceId = sel.surfaceId;
    if (!surfaceId) return;
    var id = this.getId();
    var node = this.props.node;
    var parentId = this._getSurfaceParent().getId();
    var inParentSurface = (surfaceId === parentId);
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (inParentSurface) {
      if (sel.isPropertySelection() && !sel.isCollapsed() && isEqual(sel.path, node.path)) {
        var nodeSel = node.getSelection();
        if(nodeSel.equals(sel)) {
          return {
            mode: 'selected'
          };
        }
        if (sel.contains(nodeSel)) {
          return {
            mode: 'co-selected'
          };
        }
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

  this._selectNode = function() {
    // console.log('IsolatedNodeComponent: selecting node.');
    var surface = this.context.surface;
    var doc = surface.getDocument();
    var node = this.props.node;
    surface.setSelection(doc.createSelection({
      type: 'property',
      path: node.path,
      startOffset: node.startOffset,
      endOffset: node.endOffset
    }));
  };

};

IsolatedNodeComponent.extend(InlineNodeComponent);

module.exports = InlineNodeComponent;
