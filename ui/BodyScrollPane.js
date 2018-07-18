import DefaultDOMElement from '../dom/DefaultDOMElement'
import AbstractScrollPane from './AbstractScrollPane'
import platform from '../util/platform'

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
export default class BodyScrollPane extends AbstractScrollPane {
  /*
    Expose scrollPane as a child context
  */
  getChildContext () {
    return {
      scrollPane: this
    }
  }

  getName () {
    return 'body'
  }

  render ($$) {
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
  getHeight () {
    if (platform.inBrowser) {
      return window.innerHeight
    } else {
      return 0
    }
  }

  /**
    Returns the cumulated height of a panel's content
  */
  getContentHeight () {
    if (platform.inBrowser) {
      return document.body.scrollHeight
    } else {
      return 0
    }
  }

  getContentElement () {
    if (platform.inBrowser) {
      return DefaultDOMElement.wrapNativeElement(window.document.body)
    } else {
      return null
    }
  }

  // /**
  //   Get the `.se-scrollable` element
  // */
  getScrollableElement () {
    if (platform.inBrowser) {
      return document.body
    } else {
      return null
    }
  }

  /**
    Get current scroll position (scrollTop) of `.se-scrollable` element
  */
  getScrollPosition () {
    if (platform.inBrowser) {
      return document.body.scrollTop
    } else {
      return 0
    }
  }

  setScrollPosition (scrollPos) {
    if (platform.inBrowser) {
      document.body.scrollTop = scrollPos
    }
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
}
