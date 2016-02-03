'use strict';

var isEqual = require('lodash/isEqual');
var $ = require('../util/jquery');
var oo = require('../util/oo');
var Document = require('../model/Document');
var Range = require('../model/Range');
var Coordinate = require('../model/Coordinate');
var Selection = require('../model/Selection');

/*
 * A class that maps DOM selections to model selections.
 *
 * There are some difficulties with mapping model selections:
 * 1. DOM selections can not model discontinuous selections, such as TableSelections or MultiSelections.
 * 2. Not all positions reachable via ContentEditable can be mapped to model selections. For instance,
 *    there are extra positions before and after non-editable child elements.
 * 3. Some native cursor behaviors need to be overidden, such as for navigating tables.
 *
 * @class SurfaceSelection
 * @constructor
 * @param {Element} rootElement
 */
function SurfaceSelection(rootElement, doc, container) {
  this.element = rootElement;
  this.doc = doc;
  this.container = container;
  this.state = new SurfaceSelection.State();
}

SurfaceSelection.Prototype = function() {

  function compareNodes(node1, node2) {
    var cmp = node1.compareDocumentPosition(node2);
    if (cmp&window.document.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    } else if (cmp&window.document.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    } else {
      return 0;
    }
  }

  // input methods:
  // - mouse down (setting cursor with mouse)
  // - keyboard cursor movement
  // - expand:
  //   - mouse dragging
  //   - cursor movement with shift

  // workflow for mapping from DOM to model:
  // 1. extract coordinates
  // 2. fixup coordinates
  // 3. create a model selection
  this._pullState = function(anchorNode, anchorOffset, focusNode, focusOffset, collapsed, options) {
    options = options || {};
    if (!focusNode || !anchorNode) {
      this.state = null;
      return;
    }
    var start, end;
    if (collapsed) {
      start = this.getModelCoordinate(anchorNode, anchorOffset, options);
      end = start;
    } else {
      start = this.getModelCoordinate(anchorNode, anchorOffset, options);
      end = this.getModelCoordinate(focusNode, focusOffset, options);
    }
    // the selection is reversed when the focus propertyEl is before
    // the anchor el or the computed charPos is in reverse order
    var reverse = false;
    if (!collapsed && focusNode && anchorNode) {
      var cmp = compareNodes(end.el, start.el);
      reverse = ( cmp < 0 || (cmp === 0 && end.offset < start.offset) );
    }
    if (reverse) {
      var tmp = end;
      end = start;
      start = tmp;
    }
    // console.log('### extracted selection:', start, end, reverse);
    this.state = new SurfaceSelection.State(collapsed, reverse, start, end);
  };

  this.getModelCoordinate = function(node, offset, options) {
    var current = node;
    var propertyEl = null;
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
        propertyEl = current;
        break;
      }
      // edge case: when a node is empty then then the given DOM node
      // is the node element and with offset=0
      if ($(current).is('.content-node') && offset === 0) {
        var $propertyEl = $(current).find('[data-path]');
        if ($propertyEl.length) {
          return new SurfaceSelection.Coordinate($propertyEl[0], 0);
        }
      }
      current = current.parentNode;
    }
    if (!propertyEl) {
      return this.searchForCoordinate(node, offset, options);
    }
    var charPos = this._computeCharPosition(propertyEl, node, offset);
    return new SurfaceSelection.Coordinate(propertyEl, charPos);
  };

  this._computeCharPosition = function(propertyEl, endNode, offset) {
    var charPos = 0;

    // This works with endNode being a TextNode
    function _getPosition(node) {
      if (endNode === node) {
        charPos += offset;
        return true;
      }
      if (node.nodeType === window.Node.TEXT_NODE) {
        charPos += node.textContent.length;
      } else if (node.nodeType === window.Node.ELEMENT_NODE) {
        // inline nodes have a length of 1
        // they are attached to an invisible character
        // but may have a custom rendering
        if (node.dataset && node.dataset.inline) {
          charPos += 1;
          return false;
        }
        for (var childNode = node.firstChild; childNode; childNode = childNode.nextSibling) {
          if (_getPosition(childNode)) {
            return true;
          }
        }
      }
      return false;
    }
    // count characters recursively
    // by sum up the length of all TextNodes
    // and counting inline nodes by 1.
    function _countCharacters(el) {
      var type = el.nodeType;
      if (type === window.Node.TEXT_NODE) {
        return el.textContent.length;
      } else if (type === window.Node.ELEMENT_NODE) {
        if (el.dataset && el.dataset.inline) {
          return 1;
        } else {
          var count = 0;
          for (var childNode = el.firstChild; childNode; childNode = childNode.nextSibling) {
            count += _countCharacters(childNode);
          }
          return count;
        }
      }
      return 0;
    }

    var found = false;

    // HACK: edge case which occurs when the last element is not content-editable
    // then the anchor node is the property element itself
    if (endNode === propertyEl) {
      var child = propertyEl.firstChild;
      for (var i = 0; i < offset; i++) {
        if (!child) {
          break;
        }
        charPos += _countCharacters(child);
        child = child.nextSibling;
      }
      found = true;
    } else {
      found = _getPosition(propertyEl);
    }

    if (!found) {
      console.error('Could not find char position.');
      return 0;
    }
    // console.log('charPos', charPos);
    return charPos;
  };

  /**
   * Look up model coordinate by doing a search
   * on all available property elements.
   */
  this.searchForCoordinate = function(node, offset, options) {
    var elements = this.element.querySelectorAll('*[data-path]');
    var idx, idx1, idx2, cmp1, cmp2;
    idx1 = 0;
    idx2 = elements.length-1;
    cmp1 = compareNodes(elements[idx1], node);
    cmp2 = compareNodes(elements[idx2], node);
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
      var pivotCmp = compareNodes(elements[pivotIdx], node);
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
    return new SurfaceSelection.Coordinate(elements[idx], charPos);
  };

  this._getSelection = function(anchorNode, anchorOffset, focusNode, focusOffset, collapsed) {
    this._pullState(anchorNode, anchorOffset, focusNode, focusOffset, collapsed);
    // console.log('#### selection state', this.state);
    if (!this.state) {
      return Document.nullSelection;
    }
    var doc = this.doc;
    var start = this.state.start;
    var end = this.state.end;
    var node1, node2, parent1, parent2, row1, col1, row2, col2;
    var range = new Range(
      new Coordinate(start.path, start.offset),
      new Coordinate(end.path, end.offset)
    );
    if (isEqual(start.path, end.path)) {
      return doc.createSelection({
        type: 'property',
        path: start.path,
        startOffset: start.offset,
        endOffset: end.offset,
        reverse: this.state.reverse
      });
    } else {
      node1 = doc.get(start.path[0]);
      node2 = doc.get(end.path[0]);
      parent1 = node1.getRoot();
      parent2 = node2.getRoot();
      if (parent1.type === "table" && parent1.id === parent2.id) {
        // HACK making sure that the table matrix has been computed
        parent1.getMatrix();
        row1 = node1.rowIdx;
        col1 = node1.colIdx;
        row2 = node2.rowIdx;
        col2 = node2.colIdx;
        return doc.createSelection({
          type: 'table',
          tableId: parent1.id,
          startRow: row1,
          startCol: col1,
          endRow: row2,
          endCol: col2
        });
      } else {
        return doc.createSelection({
          type: 'container',
          containerId: this.container.id,
          startPath: range.start.path,
          startOffset: range.start.offset,
          endPath: range.end.path,
          endOffset: range.end.offset,
          reverse: this.state.reverse
        });
      }
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
    var sel;
    // HACK: special treatment for edge cases as addressed by #354.
    // Sometimes anchorNode and focusNodes are the surface
    if ($(wSel.anchorNode).is('.surface')) {
      var wRange = wSel.getRangeAt(0);
      sel = this._getSelectionFromRange(wRange);
    } else {
      sel = this._getSelection(wSel.anchorNode, wSel.anchorOffset, wSel.focusNode, wSel.focusOffset, wSel.collapsed);
    }
    // console.log('### selection', sel.toString());
    return sel;
  };

  this._getSelectionFromRange = function(wRange) {
    var frag = wRange.cloneContents();
    var props = frag.querySelectorAll('*[data-path]');
    if (props.length === 0) {
      return Selection.nullSelection;
    } else {
      var doc = this.doc;
      var first = props[0];
      var last = props[props.length-1];
      var startPath = first.dataset.path.split('.');
      var text;
      if (first === last) {
        text = doc.get(startPath);
        return doc.createSelection({
          type: 'property',
          path: startPath,
          startOffset: 0,
          endOffset: text.length
        });
      } else {
        var endPath = last.dataset.path.split('.');
        text = doc.get(endPath);
        return doc.createSelection({
          type: 'container',
          containerId: this.container.id,
          startPath: startPath,
          startOffset: 0,
          endPath: endPath,
          endOffset: text.length
        });
      }
    }
  };

  var _findDomPosition = function(element, offset) {
    if (element.nodeType === document.TEXT_NODE) {
      var l = element.textContent.length;
      if (l < offset) {
        return {
          node: null,
          offset: offset-l
        };
      } else {
        return {
          node: element,
          offset: offset,
          boundary: (l === offset)
        };
      }
    } else if (element.nodeType === document.ELEMENT_NODE) {
      if (element.dataset && element.dataset.inline) {
        return {
          node: null,
          offset: offset-1
        };
      }
      // edge case: if the element itself is empty and offset===0
      if (!element.firstChild && offset === 0) {
        return {
          node: element,
          offset: 0
        };
      }
      for (var child = element.firstChild; child; child = child.nextSibling) {
        var pos = _findDomPosition(child, offset);
        if (pos.node) {
          return pos;
        } else {
          // not found in this child; then pos.offset contains the translated offset
          offset = pos.offset;
        }
      }
    }
    return {
      node: null,
      offset: offset
    };
  };

  this._getDomPosition = function(path, offset) {
    var selector = '*[data-path="'+path.join('.')+'"]';
    var componentElement = this.element.querySelector(selector);
    if (!componentElement) {
      console.warn('Could not find DOM element for path', path);
      return null;
    }
    // console.log('### Found component element', componentElement);
    var pos = _findDomPosition(componentElement, offset);
    if (pos.node) {
      return pos;
    } else {
      return null;
    }
  };

  this.setSelection = function(sel) {
    // console.log('### renderSelection', sel.toString());
    var wSel = window.getSelection();
    if (sel.isNull() || sel.isTableSelection()) {
      return this.clear();
    }
    var range = sel.getRange();
    var startPosition = this._getDomPosition(range.start.path, range.start.offset);
    if (!startPosition) {
      return this.clear();
    }
    var endPosition;
    if (range.isCollapsed()) {
      endPosition = startPosition;
    } else {
      endPosition = this._getDomPosition(range.end.path, range.end.offset);
    }
    if (!endPosition) {
      return this.clear();
    }
    // if there is a range then set replace the window selection accordingly
    wSel.removeAllRanges();
    range = window.document.createRange();
    if (sel.isReverse()) {
      range.setStart(endPosition.node, endPosition.offset);
      wSel.addRange(range);
      wSel.extend(startPosition.node, startPosition.offset);
    } else {
      range.setStart(startPosition.node, startPosition.offset);
      range.setEnd(endPosition.node, endPosition.offset);
      wSel.addRange(range);
    }
    this.state = new SurfaceSelection.State(sel.isCollapsed(), sel.isReverse(), range.start, range.end);
  };

  this.clear = function() {
    var sel = window.getSelection();
    sel.removeAllRanges();
    this.state = null;
  };

  this.getSelectionFromDOMRange = function(domRange) {
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(domRange);
    return this.getSelection();
  };
};

oo.initClass(SurfaceSelection);

SurfaceSelection.State = function(collapsed, reverse, start, end) {
  this.collapsed = collapsed;
  this.reverse = reverse;
  this.start = start;
  this.end = end;
  Object.freeze(this);
};

SurfaceSelection.Coordinate = function(el, charPos) {
  this.el = el;
  this.offset = charPos;
  this.path = el.dataset.path.split('.');
};

module.exports = SurfaceSelection;
