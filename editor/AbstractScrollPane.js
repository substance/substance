import { getSelectionRect, getRelativeRect } from '../util/windowUtils'
import getRelativeMouseBounds from '../util/getRelativeMouseBounds'
import platform from '../util/platform'
import Component from '../dom/Component'

export default class AbstractScrollPane extends Component {
  getActionHandlers () {
    return {
      scrollSelectionIntoView: this._scrollSelectionIntoView
    }
  }

  getChildContext () {
    return {
      scrollPane: this
    }
  }

  getName () {
    return this.props.name
  }

  /*
    Determine mouse bounds relative to content element
    and emit context-menu:opened event with positioning hints
  */
  _onContextMenu (e) {
    e.preventDefault()
    const mouseBounds = this._getMouseBounds(e)
    this.emit('context-menu:opened', {
      mouseBounds: mouseBounds
    })
  }

  _scrollRectIntoView (rect) {
    if (!rect) return
    // console.log('AbstractScrollPane._scrollRectIntoView()')
    const upperBound = this.getScrollPosition()
    const lowerBound = upperBound + this.getHeight()
    const selTop = rect.top
    const selBottom = rect.top + rect.height
    if ((selTop < upperBound && selBottom < upperBound) ||
        (selTop > lowerBound && selBottom > lowerBound)) {
      this.setScrollPosition(selTop)
    }
  }

  _scrollSelectionIntoView () {
    this._scrollRectIntoView(this._getSelectionRect())
  }

  /**
    Returns the height of scrollPane (inner content overflows)
  */
  getHeight () {
    throw new Error('Abstract method')
  }

  /**
    Returns the cumulated height of a panel's content
  */
  getContentHeight () {
    throw new Error('Abstract method')
  }

  getContentElement () {
    // TODO: should be wrapped in DefaultDOMElement
    throw new Error('Abstract method')
  }

  /**
    Get the `.se-scrollable` element
  */
  getScrollableElement () {
    throw new Error('Abstract method')
  }

  /**
    Get current scroll position (scrollTop) of `.se-scrollable` element
  */
  getScrollPosition () {
    throw new Error('Abstract method')
  }

  setScrollPosition () {
    throw new Error('Abstract method')
  }

  /**
    Get offset relative to `.se-content`.

    @param {DOMNode} el DOM node that lives inside the
  */
  getPanelOffsetForElement(el) { // eslint-disable-line
    throw new Error('Abstract method')
  }

  /**
    Scroll to a given sub component.

    @param {String} componentId component id, must be present in data-id attribute
  */
  scrollTo(componentId, onlyIfNotVisible) { // eslint-disable-line
    throw new Error('Abstract method')
  }

  _getContentRect () {
    return this.getContentElement().getNativeElement().getBoundingClientRect()
  }

  /*
    Get selection rectangle relative to panel content element
  */
  _getSelectionRect () {
    const editorState = this.context.editorState
    const sel = editorState.selection
    let selectionRect
    if (platform.inBrowser && sel && !sel.isNull()) {
      const contentEl = this.getContentElement()
      const contentRect = contentEl.getNativeElement().getBoundingClientRect()
      if (sel.isNodeSelection()) {
        const nodeId = sel.nodeId
        const nodeEl = contentEl.find(`*[data-id="${nodeId}"]`)
        if (nodeEl) {
          const nodeRect = nodeEl.getNativeElement().getBoundingClientRect()
          selectionRect = getRelativeRect(contentRect, nodeRect)
        } else {
          console.error(`FIXME: could not find a node with data-id=${nodeId}`)
        }
      } else {
        selectionRect = getSelectionRect(contentRect)
      }
    }
    return selectionRect
  }

  _getMouseBounds (e) {
    return getRelativeMouseBounds(e, this.getContentElement().getNativeElement())
  }
}
