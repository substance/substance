/* jshint latedef:nofunc */
'use strict';

var isEqual = require('lodash/isEqual');
var $ = require('../util/jquery');
var oo = require('../util/oo');
var Coordinate = require('../model/Coordinate');
var Selection = require('../model/Selection');
var PropertySelection = require('../model/PropertySelection');
var ContainerSelection = require('../model/ContainerSelection');
var TextPropertyComponent = require('./TextPropertyComponent');

/*
 * A class that maps DOM selections to model selections.
 *
 * There are some difficulties with mapping model selections:
 * 1. DOM selections can not model discontinuous selections.
 * 2. Not all positions reachable via ContentEditable can be mapped to model selections. For instance,
 *    there are extra positions before and after non-editable child elements.
 * 3. Some native cursor behaviors need to be overidden.
 *
 * @class SurfaceSelection
 * @constructor
 * @param {Element} rootElement
 */
function SurfaceSelection(surface) {
  this.surface = surface;
  this.doc = surface.getDocument();
}

SurfaceSelection.Prototype = function() {

  this.setSelection = function(sel) {
    // console.log('### renderSelection', sel.toString());
    var wSel = window.getSelection();
    if (sel.isNull() || sel.isTableSelection()) {
      return this.clear();
    }
    var startComp = this.surface._getTextPropertyComponent(sel.startPath);
    var start = startComp.getDOMCoordinate(sel.startOffset);
    var end;
    if (sel.isCollapsed()) {
      end = start;
    } else {
      var endComp = this.surface._getTextPropertyComponent(sel.endPath);
      end = endComp.getDOMCoordinate(sel.endOffset);
    }
    // if there is a range then set replace the window selection accordingly
    wSel.removeAllRanges();
    var wRange = window.document.createRange();
    if (sel.isReverse()) {
      wRange.setStart(end.container, end.offset);
      wSel.addRange(wRange);
      wSel.extend(start.container, start.offset);
    } else {
      wRange.setStart(start.container, start.offset);
      wRange.setEnd(end.container, end.offset);
      wSel.addRange(wRange);
    }
  };

  this.getSelection = function() {
    var wSel = window.getSelection();
    // Use this log whenever the mapping goes wrong to analyze what
    // is actually being provided by the browser
    // console.log('SurfaceSelection.getSelection()', 'anchorNode:', wSel.anchorNode, 'anchorOffset:', wSel.anchorOffset, 'focusNode:', wSel.focusNode, 'focusOffset:', wSel.focusOffset, 'collapsed:', wSel.collapsed);
    if (wSel.rangeCount === 0) {
      return Selection.nullSelection;
    }
    var range;
    // HACK: special treatment for edge cases as addressed by #354.
    // Sometimes anchorNode and focusNodes are the surface
    if ($(wSel.anchorNode).is('.surface')) {
      range = this._getRangeExhaustive(wSel.getRangeAt(0));
    } else {
      range = this._getRange(wSel.anchorNode, wSel.anchorOffset, wSel.focusNode, wSel.focusOffset, wSel.collapsed);
    }
    var sel = this._createSelection(range);
    console.log('### selection', sel.toString());
    return sel;
  };

  this.getSelectionFromDOMRange = function(wRange) {
    var range = this._getRange(wRange.startContainer, wRange.startOffset, wRange.endContainer, wRange.endOffset);
    return this._createSelection(range);
  };

  this.clear = function() {
    var sel = window.getSelection();
    sel.removeAllRanges();
    this.state = null;
  };

  // TODO: it would be preferable to leave this implementation
  // agnostic regarding selection classes
  // so, we could move this method into the surface
  this._createSelection = function(range) {
    if (!range) {
      return Selection.nullSelection;
    }
    if (range.isReverse) {
      var tmp = range.start;
      range.start = range.end;
      range.end = tmp;
    }
    var sel;
    if (isEqual(range.start.path, range.end.path)) {
      sel = new PropertySelection(range.start, range.end, range.isReverse);
    } else {
      if (!this.surface.isContainerEditor()) {
        console.error('Can only create ContainerSelection for ContainerEditors');
        return Selection.nullSelection;
      }
      sel = new ContainerSelection(this.surface.getContainerId(),
        range.start, range.end, range.isReverse);
    }
    sel.attach(this.doc);
    return sel;
  };

  this._getRange = function(anchorNode, anchorOffset, focusNode, focusOffset) {
    var start = this._getCoordinate(anchorNode, anchorOffset);
    var end;
    if (anchorNode === focusNode && anchorOffset === focusOffset) {
      end = start;
    } else {
      end = this._getCoordinate(focusNode, focusOffset);
    }
    var isReverse = _isReverse(anchorNode, anchorOffset, focusNode, focusOffset);
    if (start && end) {
      return {
        start: start,
        end: end,
        isReverse: isReverse
      };
    } else {
      return null;
    }
  };

  this._getRangeExhaustive = function(wRange) {
    var frag = wRange.cloneContents();
    var props = frag.querySelectorAll('*[data-path]');
    if (props.length === 0) {
      return null;
    } else {
      var doc = this.doc;
      var first = props[0];
      var last = props[props.length-1];
      var startPath = first.dataset.path.split('.');
      var text;
      if (first === last) {
        text = doc.get(startPath);
        return {
          start: new Coordinate(startPath, 0),
          end: new Coordinate(startPath, text.length),
          isReverse: false
        };
      } else {
        var endPath = last.dataset.path.split('.');
        text = doc.get(endPath);
        return {
          start: new Coordinate(startPath, 0),
          end: new Coordinate(endPath, text.length),
          isReverse: false
        };
      }
    }
  };

  this._getCoordinate = function(node, offset) {
    // Trying to apply the most common situation first
    // and after that covering known edge cases
    var coor = TextPropertyComponent.getCoordinate(this.surface.el, node, offset);
    if (coor) {
      return coor;
    }
    // Now we will try to apply rules for known edge cases
    var current = node;
    var path = null;
    var charPos = 0;
    while(current) {
      // as described in #273, when clicking near to an inline node
      // the provided node can be inside the inline node
      // we then continue with the inline node itself and a changed offset
      if (current.dataset && current.dataset.inline) {
        node = current;
        offset = (offset > 0) ? 1 : 0;
      }
      // if available extract a path fragment
      if (current.dataset && current.dataset.path) {
        path = current.dataset.path;
        break;
      }
      // edge case: when a node is empty then then the given DOM node
      // is the node element and with offset=0
      if ($(current).is('.content-node') && offset === 0) {
        var propertyEl = current.querySelector('[data-path]');
        if (propertyEl) {
          path = propertyEl.dataset.path;
        }
        break;
      }
      current = current.parentNode;
    }
    // finally we try a exhaustive binary search on all text properties
    if (path) {
      return new Coordinate(path, charPos);
    }

    return null;
  };

  /*
    Binary search on all text properties.
  */
  this._searchForCoordinate = function(node, offset, options) {
    var elements = this.element.querySelectorAll('*[data-path]');
    var idx, idx1, idx2, cmp1, cmp2;
    idx1 = 0;
    idx2 = elements.length-1;
    cmp1 = _compareNodes(elements[idx1], node);
    cmp2 = _compareNodes(elements[idx2], node);
    while(true) {
      var l = idx2-idx1+1;
      if (cmp2 < 0) {
        idx = idx2;
        break;
      } else if (cmp1 > 0) {
        idx = idx1;
        break;
      } else if (l<=2) {
        idx = idx2;
        break;
      }
      var pivotIdx = idx1 + Math.floor(l/2);
      var pivotCmp = _compareNodes(elements[pivotIdx], node);
      if (pivotCmp < 0) {
        idx1 = pivotIdx;
        cmp1 = pivotCmp;
      } else {
        idx2 = pivotIdx;
        cmp2 = pivotCmp;
      }
    }
    var charPos;
    if (options.direction === "left") {
      idx = Math.max(0, idx-1);
      charPos = elements[idx].textContent.length;
    } else if (cmp2<0) {
      charPos = elements[idx].textContent.length;
    } else {
      charPos = 0;
    }
    return {
      container: elements[idx],
      offset: charPos
    };
  };

  function _compareNodes(node1, node2) {
    var cmp = node1.compareDocumentPosition(node2);
    if (cmp&window.document.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    } else if (cmp&window.document.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    } else {
      return 0;
    }
  }

  function _isReverse(anchorNode, anchorOffset, focusNode, focusOffset) {
    // the selection is reversed when the focus propertyEl is before
    // the anchor el or the computed charPos is in reverse order
    var reverse = false;
    if (focusNode && anchorNode) {
      var cmp = _compareNodes(focusNode, anchorNode);
      reverse = ( cmp < 0 || (cmp === 0 && focusOffset < anchorOffset) );
    }
    return reverse;
  }

};

oo.initClass(SurfaceSelection);

SurfaceSelection.Coordinate = function(el, charPos) {
  this.el = el;
  this.offset = charPos;
  this.path = el.dataset.path.split('.');
};

module.exports = SurfaceSelection;
