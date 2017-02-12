import Component from '../../ui/Component'
import forEach from '../../util/forEach'
import DefaultDOMElement from '../../dom/DefaultDOMElement'
import getRelativeBoundingRect from '../../util/getRelativeBoundingRect'

/**
  A rich scrollbar implementation that supports highlights.   Usually
  instantiated by {@link ScrollPane}, so you will likely not create it
  yourself.

  @class Scrollbar
  @component
  @private

  @prop {ui/ScrollPane} scrollPane scroll pane the scrollbar operates on
  @prop {object} highlights hightlights grouped by scope

  @example

  ```js
  $$(Scrollbar, {
    scrollPane: this,
    highlights: {
      'bib-items': ['bib-item-citation-1', 'bib-item-citation-2']
    }
  }).ref('scrollbar')
  ```
*/

class Scrollbar extends Component {

  didMount() {
    // do a full rerender when window gets resized
    DefaultDOMElement.getBrowserWindow().on('resize', this.onResize, this)
    // update the scroll handler on scroll
    this.props.scrollPane.on('scroll', this.onScroll, this)
    // TODO: why is this necessary here?
    setTimeout(function() {
      this.updatePositions()
    }.bind(this))
  }

  dispose() {
    DefaultDOMElement.getBrowserWindow().off(this)
    this.props.scrollPane.off(this)
  }

  didUpdate() {
    this.updatePositions()
  }

  render($$) {
    let el = $$('div')
      .addClass('sc-scrollbar')
      .on('mousedown', this.onMouseDown)

    if (this.props.highlights) {
      let highlightEls = []

      forEach(this.props.highlights, function(highlights, scope) {
        forEach(highlights, function(h) {
          highlightEls.push(
            $$('div').ref(h).addClass('se-highlight sm-'+scope)
          )
        })
      })

      el.append(
        $$('div').ref('highlights')
          .addClass('se-highlights')
          .append(highlightEls)
      )
    }
    el.append($$('div').ref('thumb').addClass('se-thumb'))
    return el
  }

  updatePositions() {
    let scrollPane = this.props.scrollPane
    let scrollableEl = scrollPane.getScrollableElement()
    let contentHeight = scrollPane.getContentHeight()
    let scrollPaneHeight = scrollPane.getHeight()
    let scrollTop = scrollPane.getScrollPosition()
    let contentEl = scrollPane.getContentElement()

    // Needed for scrollbar interaction
    this.factor = (contentHeight / scrollPaneHeight)

    if (this.factor <= 1) {
      this.el.addClass('sm-hide-thumb')
    } else {
      this.el.removeClass('sm-hide-thumb')
    }

    this.refs.thumb.css({
      top: scrollTop / this.factor,
      height: scrollPaneHeight / this.factor
    })

    // If we have highlights, update them as well
    if (this.props.highlights) {
      // Compute highlights
      forEach(this.props.highlights,function(highlights) {
        forEach(highlights, function(nodeId) {
          let nodeEl = scrollableEl.find('*[data-id="'+nodeId+'"]')

          if (!nodeEl) return

          // Compute bounding rect relative to scroll pane content element
          let rect = getRelativeBoundingRect(nodeEl.getNativeElement(), contentEl.getNativeElement())
          let top = rect.top / this.factor
          let height = rect.height / this.factor

          // Use specified minHeight for highlights
          if (height < Scrollbar.overlayMinHeight) {
            height = Scrollbar.overlayMinHeight
          }

          let highlightEl = this.refs[nodeId]
          if (highlightEl) {
            this.refs[nodeId].css({
              top: top,
              height: height
            })
          } else {
            console.warn('no ref found for highlight', nodeId)
          }
        }.bind(this))
      }.bind(this))
    }
  }

  getScrollableElement() {
    return this.props.scrollPane.getScrollableElement()
  }

  onResize() {
    this.rerender()
  }

  onScroll() {
    this.updatePositions()
  }

  onMouseDown(e) {
    e.stopPropagation()
    e.preventDefault()
    this._mouseDown = true

    // temporarily, we bind to events on window level
    // because could leave the this element's area while dragging
    let _window = DefaultDOMElement.getBrowserWindow()
    _window.on('mousemove', this.onMouseMove, this)
    _window.on('mouseup', this.onMouseUp, this)

    let scrollBarOffset = this.el.getOffset().top
    let y = e.pageY - scrollBarOffset
    let thumbEl = this.refs.thumb.el
    if (e.target !== thumbEl.getNativeElement()) {
      // Jump to mousedown position
      this.offset = thumbEl.height / 2
      this.onMouseMove(e)
    } else {
      this.offset = y - thumbEl.getPosition().top
    }
  }

  // Handle Mouse Up
  onMouseUp() {
    this._mouseDown = false
    let _window = DefaultDOMElement.getBrowserWindow()
    _window.off('mousemove', this.onMouseMove, this)
    _window.off('mouseup', this.onMouseUp, this)
  }

  onMouseMove(e) {
    if (this._mouseDown) {
      let scrollPane = this.props.scrollPane
      let scrollableEl = scrollPane.getScrollableElement()
      let scrollBarOffset = this.el.getOffset().top
      let y = e.pageY - scrollBarOffset

      // find offset to visible-area.top
      let scroll = (y-this.offset)*this.factor
      scrollableEl.setProperty('scrollTop', scroll)
    }
  }
}

Scrollbar.overlayMinHeight = 2

export default Scrollbar
