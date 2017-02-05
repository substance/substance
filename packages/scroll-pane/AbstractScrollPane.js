import Component from '../../ui/Component'

class AbstractScrollPane extends Component {

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

  getName() {
    return this.props.name
  }

  /*
    Determine selection rectangle relative to content element
    and emit a dom-selection:rendered event with positioning hints
  */
  _onDomSelectionRendered() {
    let selectionRect = this._getSelectionRect()
    if (!selectionRect) return
    // Allows overlays to do positioning relative to the current
    // selection bounding rectangle.
    this.emit('dom-selection:rendered', {
      selectionRect: selectionRect
    })
    this._scrollSelectionIntoView(selectionRect)
  }

  /*
    Determine mouse bounds relative to content element
    and emit context-menu:opened event with positioning hints
  */
  _onContextMenu(e) {
    e.preventDefault()
    let mouseBounds = this._getMouseBounds(e)

    this.emit('context-menu:opened', {
      mouseBounds: mouseBounds
    })
  }

  _scrollSelectionIntoView(selectionRect) {
    let upperBound = this.getScrollPosition()
    let lowerBound = upperBound + this.getHeight()
    let selTop = selectionRect.top
    let selBottom = selectionRect.top + selectionRect.height
    if ((selTop < upperBound && selBottom < upperBound) ||
        (selTop > lowerBound && selBottom > lowerBound)) {
      this.setScrollPosition(selTop)
    }
  }

  /**
    Returns the height of scrollPane (inner content overflows)
  */
  getHeight() {
    throw new Error('Abstract method')
  }

  /**
    Returns the cumulated height of a panel's content
  */
  getContentHeight() {
    throw new Error('Abstract method')
  }

  getContentElement() {
    // TODO: should be wrapped in DefaultDOMElement
    throw new Error('Abstract method')
  }

  // /**
  //   Get the `.se-scrollable` element
  // */
  getScrollableElement() {
    throw new Error('Abstract method')
  }

  /**
    Get current scroll position (scrollTop) of `.se-scrollable` element
  */
  getScrollPosition() {
    throw new Error('Abstract method')
  }

  setScrollPosition() {
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

  /*
    Get selection rectangle relative to panel content element
  */
  _getSelectionRect() {
    throw new Error('Abstract method')
  }

  _getMouseBounds(e) { // eslint-disable-line
    throw new Error('Abstract method')
  }

}

export default AbstractScrollPane
