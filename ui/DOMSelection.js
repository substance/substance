// import last from '../util/last'
import inBrowser from '../util/inBrowser'
import Coordinate from '../model/Coordinate'
import Range from '../model/Range'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import TextPropertyComponent from './TextPropertyComponent'
import IsolatedNodeComponent from '../packages/isolated-node/IsolatedNodeComponent'
import Component from '../ui/Component'

/*
  A class that maps DOM selections to model selections.

  There are some difficulties with mapping model selections:
  1. DOM selections can not model discontinuous selections.
  2. Not all positions reachable via ContentEditable can be mapped to model selections. For instance,
     there are extra positions before and after non-editable child elements.
  3. Some native cursor behaviors need to be overidden.

  @param {Editor} Editor component
 */
class DOMSelection {

  constructor(editor) {
    this.editor = editor
    if (inBrowser) {
      this.wRange = window.document.createRange()
    }
  }

  /**
    Create a model selection by mapping the current DOM selection
    to model coordinates.

    @param {object} options
      - `direction`: `left` or `right`; a hint for disambiguations, used by Surface during cursor navigation.
    @returns {model/Selection}
  */
  getSelection(options) {
    if (!inBrowser) return
    let range = this.mapDOMSelection(options)
    let doc = this.editor.getDocument()
    // TODO: consolidate
    return doc._createSelectionFromRange(range)
  }

  getSelectionForDOMRange(wrange) {
    let range = this.mapDOMRange(wrange)
    let doc = this.editor.getDocument()
    return doc._createSelectionFromRange(range)
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
      range = _createRange({
        start: coor,
        end: coor
      })
    }
    else {
      let focusNode = DefaultDOMElement.wrapNativeElement(wSel.focusNode)
      range = this._getRange(anchorNode, wSel.anchorOffset, focusNode, wSel.focusOffset)
    }
    // console.log('DOMSelection->Model: extracted range ', range ? range.toString() : null);
    return range
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
    if (!inBrowser) return
    // console.log('### DOMSelection: setting selection', sel.toString());
    let {start, end} = this.mapModelToDOMCoordinates(sel)
    if (!start) {
      this.clear()
      return
    }
    // if there is a range then set replace the window selection accordingly
    let wSel = window.getSelection()
    let wRange = this.wRange
    // if (wSel.rangeCount > 0) {
    //   wRange = wSel.getRangeAt(0)
    // } else {
    //   wRange = this._wrange
    // }
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

  mapModelToDOMCoordinates(sel) {
    // console.log('### DOMSelection.mapModelToDOMCoordinates(): mapping selection to DOM', sel.toString());
    let rootEl
    let surface = this.editor.surfaceManager.getSurface(sel.surfaceId)
    if (!surface) {
      console.warn('Selection should have "surfaceId" set.')
      rootEl = this.editor.el
    } else {
      rootEl = surface.el
    }
    if (sel.isNull() || sel.isCustomSelection()) {
      return {}
    }

    let start, end
    if (sel.isPropertySelection() || sel.isContainerSelection()) {
      start = this._getDOMCoordinate(rootEl, sel.start)
      if (!start) {
        console.warn('FIXME: selection seems to be invalid.')
        return {}
      }
      if (sel.isCollapsed()) {
        end = start
      } else {
        end = this._getDOMCoordinate(rootEl, sel.end)
        if (!end) {
          console.warn('FIXME: selection seems to be invalid.')
          return {}
        }
      }
    } else if (sel.isNodeSelection()) {
      let comp = Component.unwrap(rootEl.find('*[data-id="'+sel.getNodeId()+'"]'))
      if (!comp) {
        console.error('Could not find component with id', sel.getNodeId())
        return {}
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
    return {start,end}
  }

  _getDOMCoordinate(rootEl, coor) {
    let comp, domCoor = null
    if (coor.isNodeCoordinate()) {
      comp = Component.unwrap(rootEl.find('*[data-id="'+coor.getNodeId()+'"]'))
      if (comp) {
        if (comp._isIsolatedNodeComponent) {
          domCoor = IsolatedNodeComponent.getDOMCoordinate(comp, coor)
        } else {
          let domOffset = 0
          if (coor.offset > 0) {
            domOffset = comp.getChildCount()
          }
          domCoor = {
            container: comp.getNativeElement(),
            offset: domOffset
          }
        }
      }
    } else {
      comp = Component.unwrap(rootEl.find('.sc-text-property[data-path="'+coor.path.join('.')+'"]'))
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
      return _createRange({ start, end, isReverse })
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
  _getCoordinate(nodeEl, offset) {
    let coor = null
    // this deals with a cursor in a TextProperty
    if (!coor) {
      coor = TextPropertyComponent.getCoordinate(this.editor.el, nodeEl, offset)
    }
    // Edge-cases: These handlers are hacked so that the case is covered,
    // not solved 'elegantly'
    if (!coor) {
      let comp = Component.unwrap(nodeEl)
      // as in #354: sometimes anchor or focus is the surface itself
      if (comp && comp._isContainerEditor) {
        let childIdx = (offset === 0) ? 0 : offset-1
        let isBefore = (offset === 0)
        let container = comp.getContainer()
        let childNode = container.getNodeAt(childIdx)
        let childComp = comp.getChildAt(childIdx)
        coor = new Coordinate([childNode.id], isBefore?0:1 )
        coor._comp = childComp
      }
      // sometimes anchor or focus is a Node component with TextPropertyComponents as children (all TextNode Components)
      else if (nodeEl.isElementNode() && nodeEl.getChildCount() > 0) {
        let child = (offset > 0) ? nodeEl.getChildAt(offset-1) : nodeEl.firstChild
        let prop
        let childComp = Component.unwrap(child)
        if (childComp && childComp._isTextPropertyComponent) {
          prop = child
        }
        // let prop = last(child.findAll('data-path'))
        if (prop) {
          coor = TextPropertyComponent.getCoordinate(nodeEl, prop, (offset > 0) ? prop.getChildCount() : 0)
        }
      }
    }
    return coor
  }

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
function _createRange({start, end, isReverse}) {
  if (isReverse) {
    [start, end] = [end, start]
  }
  if (!start._comp || !end._comp) {
    console.error('FIXME: getCoordinate() should provide a component instance')
    return null
  }
  let surface = start._comp.context.surface
  if (!surface) {
    console.error('FIXME: Editable components should have their surface in the context')
    return null
  }
  if (surface !== end._comp.context.surface) {
    console.error('Coordinates are within two different surfaces. Can not create a selection.')
    return null
  }
  return new Range(start, end, isReverse, surface.getContainerId(), surface.id)
}

export default DOMSelection
