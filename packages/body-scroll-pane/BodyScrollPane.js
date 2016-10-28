import Component from '../../ui/Component'
// import getRelativeBoundingRect from '../../util/getRelativeBoundingRect'
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
class BodyScrollPane extends Component {

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
    el.on('contextmenu', this._onContextMenu)
    el.append(this.props.children)
    return el
  }

  /**
    Returns the height of scrollPane (inner content overflows)
  */
  getHeight() {
    return document.body.clientHeight
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

  _onDomSelectionRendered() {
    const wsel = window.getSelection()
    if (wsel.rangeCount === 0) return
    const wrange = wsel.getRangeAt(0)
    const contentRect = document.body.getBoundingClientRect()
    const selectionRect = wrange.getBoundingClientRect()

    // TODO: needs work!
    const positionHints = {
      contentWidth: document.body.clientWidth,
      contentHeight: document.body.clientHeight,
      selectionRect: _getRelativeRect(contentRect, selectionRect),
      innerContentRect: contentRect
    }

    this.emit('overlay:position', positionHints)
  }

  _onContextMenu(e) {
    e.preventDefault()
    let mouseBounds = getRelativeMouseBounds(e, document.body)
    let positionHints = {
      mouseBounds: mouseBounds
    }
    this.emit('context-menu:position', positionHints)
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
