import Component from '../../ui/Component'
import getRelativeBoundingRect from '../../util/getRelativeBoundingRect'

export default class DropTeaser extends Component {
  didMount() {
    this.context.dragManager.on('drag:updated', this._onDragUpdated, this)
  }

  render($$) {
    let el = $$('div').addClass('sc-drop-teaser sm-hidden')
    el.on('dragenter', this._onDrag)
    el.on('dragover', this._onDrag)
    return el
  }

  _onDragUpdated(dragState) {
    let scrollPane = this.context.scrollPane
    let targetEl = dragState.targetEl
    if (!targetEl) return

    let contentElement = scrollPane.getContentElement().getNativeElement()
    let rect = getRelativeBoundingRect(targetEl.getNativeElement(), contentElement)

    if (dragState.insertMode === 'before') {
      rect.bottom = rect.bottom + rect.height
    } else {
      rect.top = rect.top + rect.height
    }

    this._renderDropTeaser({rect: rect, visible: dragState.isContainerDrop})
  }

  _renderDropTeaser(hints) {
    if (hints.visible) {
      this.el.removeClass('sm-hidden')
      this.el.css('top', hints.rect.top)
      this.el.css('left', hints.rect.left)
      this.el.css('right', hints.rect.right)
    } else {
      this.el.addClass('sm-hidden')
    }
  }

  // just so that the teaser does not prevent dropping
  _onDrag(e) { e.preventDefault() }
}