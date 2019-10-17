import { $$ } from '../dom'
import NodeComponent from './NodeComponent'

export default class ImageComponent extends NodeComponent {
  render () {
    const node = this.props.node
    const urlResolver = this.context.urlResolver
    let url = node.src
    if (urlResolver) {
      url = urlResolver.resolveUrl(url)
    }
    const el = $$('img', { class: 'sc-image', 'data-id': node.id, src: url })
    el.on('error', this._onError)
    if (this.state.errored) {
      el.attr({
        title: 'Could not load image.'
      })
      el.addClass('sm-error')
    }
    return el
  }

  _onError () {
    this.extendState({ errored: true })
  }
}
