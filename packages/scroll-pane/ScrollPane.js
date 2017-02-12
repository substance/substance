import platform from '../../util/platform'
import Scrollbar from '../scrollbar/Scrollbar'
import getRelativeBoundingRect from '../../util/getRelativeBoundingRect'
import AbstractScrollPane from './AbstractScrollPane'

/**
  Wraps content in a scroll pane.

  NOTE: It is best practice to put all overlays as direct childs of the ScrollPane
        to reduce the chance that positioning gets messed up (position: relative)

  @prop {String} scrollbarType 'native' or 'substance' for a more advanced visual scrollbar. Defaults to 'native'
  @prop {String} [scrollbarPosition] 'left' or 'right' only relevant when scrollBarType: 'substance'. Defaults to 'right'
  @prop {ui/Highlights} [highlights] object that maintains highlights and can be manipulated from different sources
  @prop {ui/TOCProvider} [tocProvider] object that maintains table of content entries

  @example

  ```js
  $$(ScrollPane, {
    scrollbarType: 'substance', // defaults to native
    scrollbarPosition: 'left', // defaults to right
    onScroll: this.onScroll.bind(this),
    highlights: this.contentHighlights,
    tocProvider: this.tocProvider
  })
  ```
*/
class ScrollPane extends AbstractScrollPane {

  didMount() {
    super.didMount()
    if (this.refs.scrollbar && this.props.highlights) {
      this.props.highlights.on('highlights:updated', this.onHighlightsUpdated, this)
    }
    if (this.refs.scrollbar) {
      this.domObserver = new window.MutationObserver(this._onContentChanged.bind(this))
      this.domObserver.observe(this.el.getNativeElement(), {
        subtree: true,
        attributes: true,
        characterData: true,
        childList: true,
      })
      this.context.editorSession.onPosition(this._onPosition, this)
    }
  }

  dispose() {
    super.dispose()
    if (this.props.highlights) {
      this.props.highlights.off(this)
    }
    this.context.editorSession.off(this)
    this.context.dragManager.off(this)
  }

  render($$) {
    let el = $$('div')
      .addClass('sc-scroll-pane')

    if (platform.isFF) {
      el.addClass('sm-firefox')
    }

    // When noStyle is provided we just use ScrollPane as a container, but without
    // any absolute positioned containers, leaving the body scrollable.
    if (!this.props.noStyle) {
      el.addClass('sm-default-style')
    }

    // Initialize Substance scrollbar (if enabled)
    if (this.props.scrollbarType === 'substance') {
      el.addClass('sm-substance-scrollbar')
      el.addClass('sm-scrollbar-position-' + this.props.scrollbarPosition)

      el.append(
        // TODO: is there a way to pass scrollbar highlights already
        // via props? Currently the are initialized with a delay
        $$(Scrollbar, {
          scrollPane: this
        }).ref('scrollbar')
          .attr('id', 'content-scrollbar')
      )

      // Scanline is debugging purposes, display: none by default.
      el.append(
        $$('div').ref("scanline").addClass('se-scanline')
      )
    }

    el.append(
      $$('div').ref('scrollable').addClass('se-scrollable').append(
        this.renderContent($$)
      ).on('scroll', this.onScroll)
    )
    return el
  }

  renderContent($$) {
    let contentEl = $$('div').ref('content').addClass('se-content')
    contentEl.append(this.props.children)
    if (this.props.contextMenu === 'custom') {
      contentEl.on('contextmenu', this._onContextMenu)
    }
    return contentEl
  }

  _onContentChanged() {
    this._contentChanged = true
  }

  _onPosition() {
    if (this.refs.scrollbar && this._contentChanged) {
      this._contentChanged = false
      this._updateScrollbar()
    }
  }

  _updateScrollbar() {
    if (this.refs.scrollbar) {
      this.refs.scrollbar.updatePositions()
    }
  }

  onHighlightsUpdated(highlights) {
    this.refs.scrollbar.extendProps({
      highlights: highlights
    })
  }

  onScroll() {
    let scrollPos = this.getScrollPosition()
    let scrollable = this.refs.scrollable
    if (this.props.onScroll) {
      this.props.onScroll(scrollPos, scrollable)
    }
    // Update TOCProvider given
    if (this.props.tocProvider) {
      this.props.tocProvider.markActiveEntry(this)
    }
    this.emit('scroll', scrollPos, scrollable)
  }

  /**
    Returns the height of scrollPane (inner content overflows)
  */
  getHeight() {
    let scrollableEl = this.getScrollableElement()
    return scrollableEl.height
  }

  /**
    Returns the cumulated height of a panel's content
  */
  getContentHeight() {
    let contentEl = this.refs.content.el.getNativeElement()
    // Important to use scrollHeight here (e.g. to consider overflowing
    // content, that stretches the content area, such as an overlay or
    // a context menu)
    return contentEl.scrollHeight
  }

  /**
    Get the `.se-content` element
  */
  getContentElement() {
    return this.refs.content.el
  }

  /**
    Get the `.se-scrollable` element
  */
  getScrollableElement() {
    return this.refs.scrollable.el
  }

  /**
    Get current scroll position (scrollTop) of `.se-scrollable` element
  */
  getScrollPosition() {
    let scrollableEl = this.getScrollableElement()
    return scrollableEl.getProperty('scrollTop')
  }

  setScrollPosition(scrollPos) {
    let scrollableEl = this.getScrollableElement()
    scrollableEl.setProperty('scrollTop', scrollPos)
  }

  /**
    Get offset relative to `.se-content`.

    @param {DOMNode} el DOM node that lives inside the
  */
  getPanelOffsetForElement(el) {
    let nativeEl = el.getNativeElement()
    let contentContainerEl = this.refs.content.getNativeElement()
    let rect = getRelativeBoundingRect(nativeEl, contentContainerEl)
    return rect.top
  }

  /**
    Scroll to a given sub component.

    @param {String} componentId component id, must be present in data-id attribute
  */
  scrollTo(componentId, onlyIfNotVisible) {
    let scrollableEl = this.getScrollableElement()
    let targetNode = scrollableEl.find('*[data-id="'+componentId+'"]')
    if (targetNode) {
      const offset = this.getPanelOffsetForElement(targetNode)
      let shouldScroll = true
      if (onlyIfNotVisible) {
        const height = scrollableEl.height
        const oldOffset = scrollableEl.getProperty('scrollTop')
        shouldScroll = (offset < oldOffset || oldOffset+height<offset)
      }
      if (shouldScroll) {
        this.setScrollPosition(offset)
      }
    } else {
      console.warn(componentId, 'not found in scrollable container')
    }
  }

  /*
    Determines the selection bounding rectangle relative to the scrollpane's content.
  */
  _onDomSelectionRendered() {
    super._onDomSelectionRendered()
    this._updateScrollbar()
  }

  _onContextMenu(e) {
    super._onContextMenu(e)
    this._updateScrollbar()
  }

}


export default ScrollPane
