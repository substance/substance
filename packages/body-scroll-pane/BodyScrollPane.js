import AbstractScrollPane from '../scroll-pane/AbstractScrollPane'
import getRelativeMouseBounds from '../../util/getRelativeMouseBounds'

/**
  Wraps content in a scroll pane.

  @class ScrollPane
  @component

  @prop {String} scrollbarType 'native' or 'substance' for a more advanced visual scrollbar. Defaults to 'native'
  @prop {String} [scrollbarPosition] 'left' or 'right' only relevant when scrollBarType: 'substance'. Defaults to 'right'
  @prop {ui/Highlights} [highlights] object that maintains highlights and can be manipulated from different sources
  @prop {ui/TOCProvider} [tocProvider] object that maintains table of content entries

  @example

  ```js
  $$(BodyScrollPane).append(
    content,
    $$(ContextMenu)
    $$(Overlay)
  )
  ```
*/
class BodyScrollPane extends AbstractScrollPane {

  /*
    Expose scrollPane as a child context
  */
  getChildContext() {
    return {
      scrollPane: this
    }
  }

  didMount() {
    this.handleActions({
      'domSelectionRendered': this._onDomSelectionRendered
    })
  }

  dispose() {
    this.context.editorSession.off(this)
  }

  render($$) {
    let el = $$('div')
    if (this.props.contextMenu === 'custom') {
      el.on('contextmenu', this._onContextMenu)
    }
    el.append(this.props.children)
    return el
  }

  /**
    Returns the height of scrollPane (inner content overflows)
  */
  getHeight() {
    return window.innerHeight
  }

  /**
    Returns the cumulated height of a panel's content
  */
  getContentHeight() {
    return document.body.scrollHeight
  }

  getContentElement() {
    // TODO: should be wrapped in DefaultDOMElement
    return document.body
  }

  // /**
  //   Get the `.se-scrollable` element
  // */
  getScrollableElement() {
    return document.body
  }

  /**
    Get current scroll position (scrollTop) of `.se-scrollable` element
  */
  getScrollPosition() {
    return document.body.scrollTop
  }

  setScrollPosition(scrollPos) {
    document.body.scrollTop = scrollPos
  }

  /**
    Get offset relative to `.se-content`.

    @param {DOMNode} el DOM node that lives inside the
  */
  getPanelOffsetForElement(el) { // eslint-disable-line
    console.warn('TODO: implement')
  }

  /**
    Scroll to a given sub component.

    @param {String} componentId component id, must be present in data-id attribute
  */
  scrollTo(componentId, onlyIfNotVisible) { // eslint-disable-line
    console.warn('TODO: implement')
  }

  /*
    Get selection rectangle relative to panel content element
  */
  _getSelectionRect() {
    const wsel = window.getSelection()
    if (wsel.rangeCount === 0) return
    const wrange = wsel.getRangeAt(0)
    const contentRect = document.body.getBoundingClientRect()
    const selectionRect = wrange.getBoundingClientRect()

    return _getRelativeRect(contentRect, selectionRect)
  }

  _fixForCursorRectBug() {
    let wsel = window.getSelection()
    let rects = wsel.anchorNode.parentElement.getClientRects()
    return rects[0]
  }

  _getMouseBounds(e) {
    return getRelativeMouseBounds(e, document.body)
  }

}

function _getRelativeRect(parentRect, childRect) {
  var left = childRect.left - parentRect.left
  var top = childRect.top - parentRect.top
  return {
    left: left,
    top: top,
    right: parentRect.width - left - childRect.width,
    bottom: parentRect.height - top - childRect.height,
    width: childRect.width,
    height: childRect.height
  }
}


export default BodyScrollPane
