import platform from '../../util/platform'
import Component from '../../ui/Component'
import Scrollbar from '../scrollbar/Scrollbar'
import OverlayContainer from '../overlay/OverlayContainer'
import GutterContainer from '../gutter/GutterContainer'
import getRelativeBoundingRect from '../../util/getRelativeBoundingRect'

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
    // HACK: Scrollbar should use DOMMutationObserver instead
    if (this.refs.scrollbar) {
      this.context.doc.on('document:changed', this.onDocumentChange, this, { priority: -1 })
    }

    this.handleActions({
      'updateOverlayHints': this._updateOverlayHints
    })
  }

  dispose() {
    if (this.props.highlights) {
      this.props.highlights.off(this)
    }
    this.context.doc.off(this)
  }

  render($$) {
    let el = $$('div')
      .addClass('sc-scroll-pane')
    let overlay
    let gutter

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

    if (this.props.overlay) {
      // TODO: rework this. ATM we have a component `ui/Overlay`
      // which does the positioning and gets a prop `overlay` being
      // the actual, custom component to render the content.
      // Hard-wiring the internal class for now, as all current implementations
      // use the same impl.
      overlay = $$(OverlayContainer, {
        overlay: this.props.overlay
      }).ref('overlay')
    }

    if (this.props.gutter) {
      gutter = $$(GutterContainer, {
        gutter: this.props.gutter
      }).ref('gutter')
    }

    el.append(
      $$('div').ref('scrollable').addClass('se-scrollable').append(
        $$('div').ref('content').addClass('se-content')
          .append(overlay)
          .append(gutter)
          .append(
            this.props.children
          )
      ).on('scroll', this.onScroll)
    )
    return el
  }

  _updateOverlayHints(overlayHints) {
    // Remember overlay hints for next update
    let overlay = this.refs.overlay
    let gutter = this.refs.gutter
    if (overlay) {
      overlay.position(overlayHints)
    }
    if (gutter) {
      gutter.position(overlayHints)
    }
  }

  // HACK: Scrollbar should use DOMMutationObserver instead
  onDocumentChange() {
    this.refs.scrollbar.updatePositions()
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
    let contentHeight = 0
    let contentEl = this.refs.content.el
    contentEl.childNodes.forEach(function(el) {
      contentHeight += el.getOuterHeight()
    })
    return contentHeight
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
    return Math.floor(scrollableEl.getProperty('scrollTop') + 1)
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

export default ScrollPane
