import last from 'lodash/last'
import Coordinate from '../model/Coordinate'
import Range from '../model/Range'
import DefaultDOMElement from './DefaultDOMElement'
import TextPropertyComponent from './TextPropertyComponent'
import InlineNodeComponent from '../packages/inline-node/InlineNodeComponent'
import IsolatedNodeComponent from '../packages/isolated-node/IsolatedNodeComponent'

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
class DOMSelection {

  constructor(surface) {
    this.surface = surface
    this._wrange = window.document.createRange()
  }

  /**
    Create a model selection by mapping the current DOM selection
    to model coordinates.

    @param {object} options
      - `direction`: `left` or `right`; a hint for disambiguations, used by Surface during cursor navigation.
    @returns {model/Selection}
  */
  getSelection(options) {
    let range = this.mapDOMSelection(options)
    let doc = this.surface.getDocument()
    return doc.createSelection(range)
  }

  getSelectionForDOMRange(wrange) {
    let range = this.mapDOMRange(wrange)
    let doc = this.surface.getDocument()
    return doc.createSelection(range)
  }

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
  setSelection(sel) {
    // console.log('### DOMSelection: setting selection', sel.toString());
    let wSel = window.getSelection()
    if (sel.isNull() || sel.isCustomSelection()) {
      this.clear()
      return
    }
    let start, end
    if (sel.isPropertySelection() || sel.isContainerSelection()) {
      start = this._getDOMCoordinate(sel.start)
      if (!start) {
        console.warn('FIXME: selection seems to be invalid.')
        this.clear()
        return
      }
      if (sel.isCollapsed()) {
        end = start
      } else {
        end = this._getDOMCoordinate(sel.end)
        if (!end) {
          console.warn('FIXME: selection seems to be invalid.')
          this.clear()
          return
        }
      }
    } else if (sel.isNodeSelection()) {
      let comp = this.surface.find('*[data-id="'+sel.getNodeId()+'"]')
      if (!comp) {
        console.error('Could not find component with id', sel.getNodeId())
        this.clear()
        return
      }
      if (comp._isIsolatedNodeComponent) {
        let coors = IsolatedNodeComponent.getDOMCoordinates(comp)
        if (sel.isFull()) {
          start = coors.start
          end = coors.end
        } else if (sel.isBefore()) {
          start = end = coors.start
        } else {
          start = end = coors.end
        }
      } else {
        let _nodeEl = comp.el
        start = {
          container: _nodeEl.getNativeElement(),
          offset: 0
        }
        end = {
          container: _nodeEl.getNativeElement(),
          offset: _nodeEl.getChildCount()
        }
        if (sel.isBefore()) {
          end = start
        } else if (sel.isAfter()) {
          start = end
        }
      }
    }
    // console.log('Model->DOMSelection: mapped to DOM coordinates', start.container, start.offset, end.container, end.offset, 'isReverse?', sel.isReverse());

    // if there is a range then set replace the window selection accordingly
    let wRange
    if (wSel.rangeCount > 0) {
      wRange = wSel.getRangeAt(0)
    } else {
      wRange = this._wrange
    }
    wSel.removeAllRanges()
    if (sel.isCollapsed()) {
      wRange.setStart(start.container, start.offset)
      wRange.setEnd(start.container, start.offset)
      wSel.addRange(wRange)
    } else {
      if (sel.isReverse()) {
        // console.log('DOMSelection: rendering a reverse selection.');
        let tmp = start
        start = end
        end = tmp
        // HACK: using wRange setEnd does not work reliably
        // so we set just the start anchor
        // and then use window.Selection.extend()
        // unfortunately we are not able to test this behavior as it needs
        // triggering native keyboard events
        wRange.setStart(start.container, start.offset)
        wRange.setEnd(start.container, start.offset)
        wSel.addRange(wRange)
        wSel.extend(end.container, end.offset)
      } else {
        wRange.setStart(start.container, start.offset)
        wRange.setEnd(end.container, end.offset)
        wSel.addRange(wRange)
      }
    }
    // console.log('Model->DOMSelection: mapped selection to DOM', 'anchorNode:', wSel.anchorNode, 'anchorOffset:', wSel.anchorOffset, 'focusNode:', wSel.focusNode, 'focusOffset:', wSel.focusOffset, 'collapsed:', wSel.collapsed);
  }

  _getDOMCoordinate(coor) {
    let comp, domCoor = null
    if (coor.isNodeCoordinate()) {
      comp = this.surface.find('*[data-id="'+coor.getNodeId()+'"]')
      if (comp) {
        if (comp._isIsolatedNodeComponent) {
          domCoor = IsolatedNodeComponent.getDOMCoordinate(comp, coor)
        } else {
          domCoor = {
            container: comp.getNativeElement(),
            offset: coor.offset
          }
        }
      }
    } else {
      comp = this.surface._getTextPropertyComponent(coor.path)
      if (comp) {
        domCoor = comp.getDOMCoordinate(coor.offset)
      }
    }
    return domCoor
  }

  /*
    Map a DOM range to a model range.

    @param {Range} range
    @returns {model/Range}
  */
  mapDOMRange(wRange) {
    return this._getRange(
      DefaultDOMElement.wrapNativeElement(wRange.startContainer),
      wRange.startOffset,
      DefaultDOMElement.wrapNativeElement(wRange.endContainer),
      wRange.endOffset)
  }

  /*
    Maps the current DOM selection to a model range.

    @param {object} [options]
      - `direction`: `left` or `right`; a hint for disambiguations, used by Surface during cursor navigation.
    @returns {model/Range}
  */
  mapDOMSelection(options) {
    let range
    let wSel = window.getSelection()
    // Use this log whenever the mapping goes wrong to analyze what
    // is actually being provided by the browser
    // console.log('DOMSelection->Model: anchorNode:', wSel.anchorNode, 'anchorOffset:', wSel.anchorOffset, 'focusNode:', wSel.focusNode, 'focusOffset:', wSel.focusOffset, 'collapsed:', wSel.collapsed);
    if (wSel.rangeCount === 0) {
      return null;
    }
    let anchorNode = DefaultDOMElement.wrapNativeElement(wSel.anchorNode)
    if (wSel.isCollapsed) {
      let coor = this._getCoordinate(anchorNode, wSel.anchorOffset, options)
      if (!coor) return null
      // EXPERIMENTAL: when the cursor is in an IsolatedNode
      // we return a selection for the whole node
      if (coor.__inIsolatedBlockNode__) {
        range = _createRangeForIsolatedBlockNode(coor.path[0], this.getContainerId())
      } else if (coor.__inInlineNode__) {
        // HACK: relying on hints left by InlineNodeComponent.getCoordinate()
        range = _createRange(
          new Coordinate(coor.path, coor.__startOffset__),
          new Coordinate(coor.path, coor.__endOffset__),
          false, this.getContainerId()
        )
      } else {
        range = _createRange(coor, coor, false, this.getContainerId())
      }
    }
    // HACK: special treatment for edge cases as addressed by #354.
    // Sometimes anchorNode and focusNodes are the surface
    else {
      if (anchorNode.isElementNode() && anchorNode.is('.sc-surface')) {
        range = this._getEnclosingRange(wSel.getRangeAt(0))
      } else {
        let focusNode = DefaultDOMElement.wrapNativeElement(wSel.focusNode)
        range = this._getRange(anchorNode, wSel.anchorOffset, focusNode, wSel.focusOffset)
      }
    }
    // console.log('DOMSelection->Model: extracted range', range.toString());
    return range
  }

  /*
    Clear the DOM selection.
  */
  clear() {
    window.getSelection().removeAllRanges()
  }

  collapse(dir) {
    let wSel = window.getSelection()
    let wRange
    if (wSel.rangeCount > 0) {
      wRange = wSel.getRangeAt(0)
      wRange.collapse(dir === 'left')
      wSel.removeAllRanges()
      wSel.addRange(wRange)
    }
  }

  getContainerId() {
    if (this.surface.isContainerEditor()) {
      return this.surface.getContainerId();
    } else {
      return null;
    }
  }

  /*
    Extract a model range from given DOM elements.

    @param {Node} anchorNode
    @param {number} anchorOffset
    @param {Node} focusNode
    @param {number} focusOffset
    @returns {model/Range}
  */
  _getRange(anchorNode, anchorOffset, focusNode, focusOffset) {
    let start = this._getCoordinate(anchorNode, anchorOffset)
    let end
    if (anchorNode === focusNode && anchorOffset === focusOffset) {
      end = start
    } else {
      end = this._getCoordinate(focusNode, focusOffset)
    }
    let isReverse = DefaultDOMElement.isReverse(anchorNode, anchorOffset, focusNode, focusOffset)
    if (start && end) {
      return _createRange(start, end, isReverse, this.getContainerId())
    } else {
      return null
    }
  }

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
  _getCoordinate(nodeEl, offset, options) {
    // Trying to apply the most common situation first
    // and after that covering known edge cases
    let surfaceEl = this.surface.el
    let coor = null
    if (!coor) {
      coor = InlineNodeComponent.getCoordinate(nodeEl, offset)
      if (coor) {
        coor.__inInlineNode__ = true
      }
    }
    // as this is the most often case, try to map the coordinate within
    // a TextPropertyComponent
    if (!coor) {
      coor = TextPropertyComponent.getCoordinate(surfaceEl, nodeEl, offset)
    }
    // special treatment for isolated nodes
    if (!coor) {
      coor = IsolatedNodeComponent.getCoordinate(surfaceEl, nodeEl, offset)
      if (coor) {
        coor.__inIsolatedBlockNode__ = true
      }
    }
    // finally fall back to a brute-force search
    if (!coor) {
      coor = this._searchForCoordinate(nodeEl, offset, options)
    }
    return coor
  }

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
  _searchForCoordinate(node, offset, options) {
    // NOTE: assuming that most situations are covered by
    // TextPropertyComponent.getCoordinate already, we are trying just to
    // solve the remaining scenarios, in an opportunistic way
    options = options || {}
    options.direction = options.direction || 'right'
    let dir = options.direction
    if (node.isElementNode()) {
      let childCount = node.getChildCount()
      offset = Math.max(0, Math.min(childCount, offset))
      let el = node.getChildAt(offset)
      while (el) {
        let textPropertyEl
        if (dir === 'right') {
          if (el.isElementNode()) {
            if (el.getAttribute('data-path')) {
              textPropertyEl = el
            } else {
              textPropertyEl = el.find('*[data-path]')
            }
            if (textPropertyEl) {
              return new Coordinate(_getPath(textPropertyEl), 0)
            }
          }
          el = el.getNextSibling()
        } else {
          if (el.isElementNode()) {
            if (el.getAttribute('data-path')) {
              textPropertyEl = el
            } else {
              let textPropertyEls = el.findAll('*[data-path]')
              textPropertyEl = last(textPropertyEls)
            }
            if (textPropertyEl) {
              let path = _getPath(textPropertyEl)
              let doc = this.surface.getDocument()
              let text = doc.get(path)
              return new Coordinate(path, text.length)
            }
          }
          el = el.getPreviousSibling()
        }
      }
    }
    // if we land here then we could not find an addressable element on this level.
    // try to find it one level higher
    if (node !== this.surface.el) {
      let parent = node.getParent()
      let nodeIdx = parent.getChildIndex(node)
      if (dir === 'right') {
        nodeIdx++
      }
      return this._searchForCoordinate(parent, nodeIdx, options)
    }

    return null
  }

  /*
    Computes a model range that encloses all properties
    spanned by a given DOM range.

    This is used in edge cases, where DOM selection anchors are not
    within TextProperties.

    @param {Range} range
    @returns {model/Range}
  */
  _getEnclosingRange(wRange) {
    let frag = wRange.cloneContents()
    let props = frag.querySelectorAll('*[data-path]')
    if (props.length === 0) {
      return null
    } else {
      let doc = this.surface.getDocument()
      let first = props[0]
      let last = props[props.length-1]
      let startPath = _getPath(first)
      let text
      if (first === last) {
        text = doc.get(startPath)
        return new Range(
          new Coordinate(startPath, 0),
          new Coordinate(startPath, text.length),
          false
        )
      } else {
        let endPath = _getPath(last)
        text = doc.get(endPath)
        return new Range(
          new Coordinate(startPath, 0),
          new Coordinate(endPath, text.length),
          false
        )
      }
    }
  }
}

function _getPath(el) {
  if (!el._isDOMElement) {
    el = DefaultDOMElement.wrapNativeElement(el)
  }
  if (el.isElementNode()) {
    let pathStr = el.getAttribute('data-path')
    return pathStr.split('.')
  }
  throw new Error("Can't get path from element:" + el.outerHTML)
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
    let tmp = start
    start = end
    end = tmp
  }
  return new Range(start, end, isReverse, containerId)
}

function _createRangeForIsolatedBlockNode(nodeId, containerId) {
  return new Range(new Coordinate([nodeId], 0), new Coordinate([nodeId], 1), false, containerId)
}


export default DOMSelection
