"use strict";

var last = require('lodash/last');
var oo = require('../util/oo');
var Coordinate = require('../model/Coordinate');
var Range = require('../model/Range');
var DefaultDOMElement = require('./DefaultDOMElement');
var TextPropertyComponent = require('./TextPropertyComponent');
var InlineNodeComponent = require('./InlineNodeComponent');
var IsolatedNodeComponent = require('./IsolatedNodeComponent');

/*
 * A class that maps DOM selections to model selections.
 *
 * There are some difficulties with mapping model selections:
 * 1. DOM selections can not model discontinuous selections.
 * 2. Not all positions reachable via ContentEditable can be mapped to model selections. For instance,
 *    there are extra positions before and after non-editable child elements.
 * 3. Some native cursor behaviors need to be overidden.
 *
 * @class DOMSelection
 * @constructor
 * @param {Element} rootElement
 */
function DOMSelection(surface) {
  this.surface = surface;
  this._wrange = window.document.createRange();
}

DOMSelection.Prototype = function() {

  /**
    Create a model selection by mapping the current DOM selection
    to model coordinates.

    @param {object} options
      - `direction`: `left` or `right`; a hint for disambiguations, used by Surface during cursor navigation.
    @returns {model/Selection}
  */
  this.getSelection = function(options) {
    var range = this.mapDOMSelection(options);
    var doc = this.surface.getDocument();
    return doc.createSelection(range);
  };

  // function _printStacktrace() {
  //   try {
  //     throw new Error();
  //   } catch (err) {
  //     console.log(err.stack);
  //   }
  // }

  /**
    Transfer a given model selection into the DOM.

    @param {model/Selection} sel
  */
  this.setSelection = function(sel) {
    // console.log('### DOMSelection: setting selection', sel.toString());
    var wSel = window.getSelection();
    if (sel.isNull() || sel.isCustomSelection()) {
      this.clear();
      return;
    }
    var start, end;
    if (sel.isPropertySelection() || sel.isContainerSelection()) {
      start = this._getDOMCoordinate(sel.start);
      if (!start) {
        console.warn('FIXME: selection seems to be invalid.');
        this.clear();
        return;
      }
      if (sel.isCollapsed()) {
        end = start;
      } else {
        end = this._getDOMCoordinate(sel.end);
        if (!end) {
          console.warn('FIXME: selection seems to be invalid.');
          this.clear();
          return;
        }
      }
    } else if (sel.isNodeSelection()) {
      var comp = this.surface.find('*[data-id="'+sel.getNodeId()+'"]');
      if (!comp) {
        console.error('Could not find component with id', sel.getNodeId());
        this.clear();
        return;
      }
      if (comp._isIsolatedNodeComponent) {
        var coors = IsolatedNodeComponent.getDOMCoordinates(comp);
        if (sel.isFull()) {
          start = coors.start;
          end = coors.end;
        } else if (sel.isBefore()) {
          start = end = coors.start;
        } else {
          start = end = coors.end;
        }
      } else {
        var _nodeEl = comp.el;
        start = {
          container: _nodeEl.getNativeElement(),
          offset: 0
        };
        end = {
          container: _nodeEl.getNativeElement(),
          offset: _nodeEl.getChildCount()
        };
        if (sel.isBefore()) {
          end = start;
        } else if (sel.isAfter()) {
          start = end;
        }
      }
    }
    // console.log('Model->DOMSelection: mapped to DOM coordinates', start.container, start.offset, end.container, end.offset, 'isReverse?', sel.isReverse());

    // if there is a range then set replace the window selection accordingly
    var wRange;
    if (wSel.rangeCount > 0) {
      wRange = wSel.getRangeAt(0);
    } else {
      wRange = this._wrange;
    }
    wSel.removeAllRanges();
    if (sel.isCollapsed()) {
      wRange.setStart(start.container, start.offset);
      wRange.setEnd(start.container, start.offset);
      wSel.addRange(wRange);
    } else {
      if (sel.isReverse()) {
        // console.log('DOMSelection: rendering a reverse selection.');
        var tmp = start;
        start = end;
        end = tmp;
        // HACK: using wRange setEnd does not work reliably
        // so we set just the start anchor
        // and then use window.Selection.extend()
        // unfortunately we are not able to test this behavior as it needs
        // triggering native keyboard events
        wRange.setStart(start.container, start.offset);
        wRange.setEnd(start.container, start.offset);
        wSel.addRange(wRange);
        wSel.extend(end.container, end.offset);
      } else {
        wRange.setStart(start.container, start.offset);
        wRange.setEnd(end.container, end.offset);
        wSel.addRange(wRange);
      }
    }
    // console.log('Model->DOMSelection: mapped selection to DOM', 'anchorNode:', wSel.anchorNode, 'anchorOffset:', wSel.anchorOffset, 'focusNode:', wSel.focusNode, 'focusOffset:', wSel.focusOffset, 'collapsed:', wSel.collapsed);
  };

  this._getDOMCoordinate = function(coor) {
    var comp, domCoor = null;
    if (coor.isNodeCoordinate()) {
      comp = this.surface.find('*[data-id="'+coor.getNodeId()+'"]');
      if (comp) {
        if (comp._isIsolatedNodeComponent) {
          domCoor = IsolatedNodeComponent.getDOMCoordinate(comp, coor);
        } else {
          domCoor = {
            container: comp.getNativeElement(),
            offset: coor.offset
          };
        }
      }
    } else {
      comp = this.surface._getTextPropertyComponent(coor.path);
      if (comp) {
        domCoor = comp.getDOMCoordinate(coor.offset);
      }
    }
    return domCoor;
  };

  /*
    Map a DOM range to a model range.

    @param {Range} range
    @returns {model/Range}
  */
  this.mapDOMRange = function(wRange) {
    return this._getRange(wRange.startContainer, wRange.startOffset,
      wRange.endContainer, wRange.endOffset);
  };

  /*
    Maps the current DOM selection to a model range.

    @param {object} [options]
      - `direction`: `left` or `right`; a hint for disambiguations, used by Surface during cursor navigation.
    @returns {model/Range}
  */
  this.mapDOMSelection = function(options) {
    var range;
    var wSel = window.getSelection();
    // Use this log whenever the mapping goes wrong to analyze what
    // is actually being provided by the browser
    // console.log('DOMSelection->Model: anchorNode:', wSel.anchorNode, 'anchorOffset:', wSel.anchorOffset, 'focusNode:', wSel.focusNode, 'focusOffset:', wSel.focusOffset, 'collapsed:', wSel.collapsed);
    if (wSel.rangeCount === 0) {
      return null;
    }
    var anchorNode = DefaultDOMElement.wrapNativeElement(wSel.anchorNode);
    if (wSel.isCollapsed) {
      var coor = this._getCoordinate(anchorNode, wSel.anchorOffset, options);
      // EXPERIMENTAL: when the cursor is in an IsolatedNode
      // we return a selection for the whole node
      if (coor.__inIsolatedBlockNode__) {
        range = _createRangeForIsolatedBlockNode(coor.path[0], this.getContainerId());
      } else if (coor.__inInlineNode__) {
        // HACK: relying on hints left by InlineNodeComponent.getCoordinate()
        range = _createRange(
          new Coordinate(coor.path, coor.__startOffset__),
          new Coordinate(coor.path, coor.__endOffset__),
          false, this.getContainerId()
        );
      } else {
        range = _createRange(coor, coor, false, this.getContainerId());
      }
    }
    // HACK: special treatment for edge cases as addressed by #354.
    // Sometimes anchorNode and focusNodes are the surface
    else {
      if (anchorNode.isElementNode() && anchorNode.is('.sc-surface')) {
        range = this._getEnclosingRange(wSel.getRangeAt(0));
      } else {
        var focusNode = DefaultDOMElement.wrapNativeElement(wSel.focusNode);
        range = this._getRange(anchorNode, wSel.anchorOffset, focusNode, wSel.focusOffset);
      }
    }
    // console.log('DOMSelection->Model: extracted range', range.toString());
    return range;
  };

  /*
    Clear the DOM selection.
  */
  this.clear = function() {
    window.getSelection().removeAllRanges();
  };

  this.collapse = function(dir) {
    var wSel = window.getSelection();
    var wRange;
    if (wSel.rangeCount > 0) {
      wRange = wSel.getRangeAt(0);
      wRange.collapse(dir === 'left');
      wSel.removeAllRanges();
      wSel.addRange(wRange);
    }
  };

  this.getContainerId = function() {
    if (this.surface.isContainerEditor()) {
      return this.surface.getContainerId();
    } else {
      return null;
    }
  };

  /*
    Extract a model range from given DOM elements.

    @param {Node} anchorNode
    @param {number} anchorOffset
    @param {Node} focusNode
    @param {number} focusOffset
    @returns {model/Range}
  */
  this._getRange = function(anchorNode, anchorOffset, focusNode, focusOffset) {
    var start = this._getCoordinate(anchorNode, anchorOffset);
    var end;
    if (anchorNode === focusNode && anchorOffset === focusOffset) {
      end = start;
    } else {
      end = this._getCoordinate(focusNode, focusOffset);
    }
    var isReverse = DefaultDOMElement.isReverse(anchorNode, anchorOffset, focusNode, focusOffset);
    if (start && end) {
      return _createRange(start, end, isReverse, this.getContainerId());
    } else {
      return null;
    }
  };

  /*
    Map a DOM coordinate to a model coordinate.

    @param {Node} node
    @param {number} offset
    @param {object} options
    @param {object} [options]
      - `direction`: `left` or `right`; a hint for disambiguation.
    @returns {model/Coordinate}

    @info

    `options.direction` can be used to control the result when this function is called
    after cursor navigation. The root problem is that we are using ContentEditable on
    Container level (as opposed to TextProperty level). The native ContentEditable allows
    cursor positions which do not make sense in the model sense.

    For example,

    ```
    <div contenteditable=true>
      <p data-path="p1.content">foo</p>
      <img>
      <p data-path="p1.content">bar</p>
    </div>
    ```
    would allow to set the cursor directly before or after the image, which
    we want to prevent, as it is not a valid insert position for text.
    Instead, if we find the DOM selection in such a situation, then we map it to the
    closest valid model address. And this depends on the direction of movement.
    Moving `left` would provide the previous address, `right` would provide the next address.
    The default direction is `right`.
  */
  this._getCoordinate = function(nodeEl, offset, options) {
    // Trying to apply the most common situation first
    // and after that covering known edge cases
    var surfaceEl = this.surface.el;
    var coor = null;
    if (!coor) {
      coor = InlineNodeComponent.getCoordinate(nodeEl, offset);
      if (coor) {
        coor.__inInlineNode__ = true;
      }
    }
    // as this is the most often case, try to map the coordinate within
    // a TextPropertyComponent
    if (!coor) {
      coor = TextPropertyComponent.getCoordinate(surfaceEl, nodeEl, offset);
    }
    // special treatment for isolated nodes
    if (!coor) {
      coor = IsolatedNodeComponent.getCoordinate(surfaceEl, nodeEl, offset);
      if (coor) {
        coor.__inIsolatedBlockNode__ = true;
      }
    }
    // finally fall back to a brute-force search
    if (!coor) {
      coor = this._searchForCoordinate(nodeEl, offset, options);
    }
    return coor;
  };

  /*
    Map a DOM coordinate to a model coordinate via a brute-force search
    on all properties.

    This is used as a backup strategy for delicate DOM selections.

    @param {Node} node
    @param {number} offset
    @param {object} options
    @param {'left'|'right'} options.direction
    @returns {model/Coordinate} the coordinate
  */
  this._searchForCoordinate = function(node, offset, options) {
    // NOTE: assuming that most situations are covered by
    // TextPropertyComponent.getCoordinate already, we are trying just to
    // solve the remaining scenarios, in an opportunistic way
    options = options || {};
    options.direction = options.direction || 'right';
    var dir = options.direction;
    if (node.isElementNode()) {
      var childCount = node.getChildCount();
      offset = Math.max(0, Math.min(childCount, offset));
      var el = node.getChildAt(offset);
      while (el) {
        var textPropertyEl;
        if (dir === 'right') {
          if (el.isElementNode()) {
            if (el.getAttribute('data-path')) {
              textPropertyEl = el;
            } else {
              textPropertyEl = el.find('*[data-path]');
            }
            if (textPropertyEl) {
              return new Coordinate(_getPath(textPropertyEl), 0);
            }
          }
          el = el.getNextSibling();
        } else {
          if (el.isElementNode()) {
            if (el.getAttribute('data-path')) {
              textPropertyEl = el;
            } else {
              var textPropertyEls = el.findAll('*[data-path]');
              textPropertyEl = last(textPropertyEls);
            }
            if (textPropertyEl) {
              var path = _getPath(textPropertyEl);
              var doc = this.surface.getDocument();
              var text = doc.get(path);
              return new Coordinate(path, text.length);
            }
          }
          el = el.getPreviousSibling();
        }
      }
    }
    // if we land here then we could not find an addressable element on this level.
    // try to find it one level higher
    if (node !== this.surface.el) {
      var parent = node.getParent();
      var nodeIdx = parent.getChildIndex(node);
      if (dir === 'right') {
        nodeIdx++;
      }
      return this._searchForCoordinate(parent, nodeIdx, options);
    }

    return null;
  };

  /*
    Computes a model range that encloses all properties
    spanned by a given DOM range.

    This is used in edge cases, where DOM selection anchors are not
    within TextProperties.

    @param {Range} range
    @returns {model/Range}
  */
  this._getEnclosingRange = function(wRange) {
    var frag = wRange.cloneContents();
    var props = frag.querySelectorAll('*[data-path]');
    if (props.length === 0) {
      return null;
    } else {
      var doc = this.surface.getDocument();
      var first = props[0];
      var last = props[props.length-1];
      var startPath = _getPath(first);
      var text;
      if (first === last) {
        text = doc.get(startPath);
        return new Range(
          new Coordinate(startPath, 0),
          new Coordinate(startPath, text.length),
          false
        );
      } else {
        var endPath = _getPath(last);
        text = doc.get(endPath);
        return new Range(
          new Coordinate(startPath, 0),
          new Coordinate(endPath, text.length),
          false
        );
      }
    }
  };

  function _getPath(el) {
    if (!el._isDOMElement) {
      el = DefaultDOMElement.wrapNativeElement(el);
    }
    if (el.isElementNode()) {
      var pathStr = el.getAttribute('data-path');
      return pathStr.split('.');
    }
    throw new Error("Can't get path from element:" + el.outerHTML);
  }

  /*
   Helper for creating a model range correctly
   as for model/Range start should be before end.

   In contrast to that, DOM selections are described with anchor and focus coordinates,
   i.e. bearing the information of direction implicitly.
   To simplify the implementation we treat anchor and focus equally
   and only at the end exploit the fact deriving an isReverse flag
   and bringing start and end in the correct order.
  */
  function _createRange(start, end, isReverse, containerId) {
    if (isReverse) {
      var tmp = start;
      start = end;
      end = tmp;
    }
    return new Range(start, end, isReverse, containerId);
  }

  function _createRangeForIsolatedBlockNode(nodeId, containerId) {
    return new Range(new Coordinate([nodeId], 0), new Coordinate([nodeId], 1), false, containerId);
  }

};

oo.initClass(DOMSelection);

module.exports = DOMSelection;
