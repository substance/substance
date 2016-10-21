import platform from '../../util/platform'
import Component from '../../ui/Component'
import Scrollbar from '../scrollbar/Scrollbar'
import getRelativeBoundingRect from '../../util/getRelativeBoundingRect'
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
  $$(ScrollPane, {
    scrollbarType: 'substance', // defaults to native
    scrollbarPosition: 'left', // defaults to right
    onScroll: this.onScroll.bind(this),
    highlights: this.contentHighlights,
    tocProvider: this.tocProvider
  })
  ```
 */
class ScrollPane extends Component {

  constructor(...args) {
    super(...args)

    this.handleActions({
      'domSelectionRendered': this._onDomSelectionRendered
    })
  }

  /*
    Expose scrollPane as a child context
  */
  getChildContext() {
    return {
      scrollPane: this
    }
  }

  didMount() {
    if (this.refs.scrollbar && this.props.highlights) {
      this.props.highlights.on('highlights:updated', this.onHighlightsUpdated, this)
    }
    if (this.refs.scrollbar) {
      this.domObserver = new window.MutationObserver(this._onContentChanged.bind(this));
      this.domObserver.observe(this.el.getNativeElement(), {
        subtree: true,
        attributes: true,
        characterData: true,
        childList: true,
      });
      this.context.editSession.on('post-render', this._onPostRender, this)
    }
  }

  dispose() {
    if (this.props.highlights) {
      this.props.highlights.off(this)
    }
    this.context.flow.off(this)
  }

  render($$) {
    let ContextMenu = this.getComponent('context-menu')
    let Overlay = this.getComponent('overlay')
    let Gutter = this.getComponent('gutter')
    let el = $$('div')
      .addClass('sc-scroll-pane')

    if (platform.isFF) {
      el.addClass('sm-firefox')
    }

    // Initialize Substance scrollbar (if enabled)
    if (this.props.scrollbarType === 'substance') {
      el.addClass('sm-substance-scrollbar')
      el.addClass('sm-scrollbar-position-'+this.props.scrollbarPosition)

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

    let overlay = $$(Overlay).ref('overlay')
    let gutter = $$(Gutter).ref('gutter')

    let contextMenu = $$(ContextMenu).ref('contextMenu')
    let contentEl = $$('div').ref('content').addClass('se-content')
      .append(overlay)
      .append(gutter)
      .append(contextMenu)
      .on('contextmenu', this.onContextMenu)

    if (contextMenu) {
      contentEl.append(contextMenu)
    }

    contentEl.append(this.props.children)

    el.append(
      $$('div').ref('scrollable').addClass('se-scrollable').append(
        contentEl
      ).on('scroll', this.onScroll)
    )
    return el
  }

  _onContentChanged() {
    this._contentChanged = true
  }

  _onPostRender() {
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

  _onDomSelectionRendered() {
    const wsel = window.getSelection()
    if (wsel.rangeCount === 0) return
    const wrange = wsel.getRangeAt(0)
    const parentRect = this.refs.content.getNativeElement().getBoundingClientRect()
    const selRect = wrange.getBoundingClientRect()

    const overlayHints = {
      rectangle: _getRelativeRect(parentRect, selRect)
    }
    // Remember overlay hints for next update
    let overlay = this.refs.overlay
    let gutter = this.refs.gutter
    if (overlay) {
      if (overlay.hasActiveTools()) {
        overlay.show(overlayHints)
      } else {
        overlay.hide()
      }
    }
    if (gutter) {
      if (gutter.hasActiveTools()) {
        gutter.show(overlayHints)
      } else {
        gutter.hide()
      }
    }
    this._updateScrollbar()
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

  onContextMenu(e) {
    e.preventDefault();
    let contentContainerEl = this.refs.content.el.el
    let mouseBounds = getRelativeMouseBounds(e, contentContainerEl)
    let contextMenu = this.refs.contextMenu
    contextMenu.show(mouseBounds)
    this._updateScrollbar()
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

  /**
    Get offset relative to `.se-content`.

    @param {DOMNode} el DOM node that lives inside the
  */
  getPanelOffsetForElement(el) {
    let nativeEl = el.el
    let contentContainerEl = this.refs.content.el.el
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
        scrollableEl.setProperty('scrollTop', offset)
      }
    } else {
      console.warn(componentId, 'not found in scrollable container')
    }
  }
}


function _getRelativeRect(parentRect, childRect) {
  var left = childRect.left - parentRect.left;
  var top = childRect.top - parentRect.top;
  return {
    left: left,
    top: top,
    right: parentRect.width - left - childRect.width,
    bottom: parentRect.height - top - childRect.height,
    width: childRect.width,
    height: childRect.height
  }
}

export default ScrollPane
