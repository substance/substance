import Component from '../../ui/Component'

export default class DropTeaser extends Component {
  didMount() {
    this.context.scrollPane.on('drop-teaser:position', this._update, this)
  }

  render($$) {
    let el = $$('div').addClass('sc-drop-teaser sm-hidden')
    el.on('dragenter', this._onDrag)
    el.on('dragover', this._onDrag)
    return el
  }

  _update(hints) {
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