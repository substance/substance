'use strict';

var isEqual = require('lodash/isEqual');
var startsWith = require('lodash/startsWith');
var Coordinate = require('../model/Coordinate');
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

  this._deriveStateFromSelectionState = function(selState) {
    var sel = selState.getSelection();
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
          return { mode: 'selected' };
        }
        if (sel.contains(nodeSel)) {
          return { mode: 'co-selected' };
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

InlineNodeComponent.getCoordinate = function(el) {
  // special treatment for block-level isolated-nodes
  var parent = el.getParent();
  if (el.isTextNode() && parent.is('.se-slug')) {
    var slug = parent;
    var nodeEl = slug.getParent();
    if (nodeEl.is('.sc-inline-node')) {
      var startOffset = Number(nodeEl.getAttribute('data-offset'));
      var len = Number(nodeEl.getAttribute('data-length'));
      var charPos = startOffset;
      if (slug.is('sm-after')) charPos += len;
      var path;
      while ( (nodeEl = nodeEl.getParent()) ) {
        var pathStr = nodeEl.getAttribute('data-path');
        if (pathStr) {
          path = pathStr.split('.');
          var coor = new Coordinate(path, charPos);
          coor.__inInlineNode__ = true;
          coor.__startOffset__ = startOffset;
          coor.__endOffset__ = startOffset+len;
          return coor;
        }
      }
    }
  }
  return null;
};

module.exports = InlineNodeComponent;
