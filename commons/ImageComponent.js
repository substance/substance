import { $$ } from '../dom'
import NodeComponent from './NodeComponent'

export default class ImageComponent extends NodeComponent {
  render () {
    const { errored } = this.state
    const { node, placeholder } = this.props
    const urlResolver = this.context.urlResolver
    let url = node.src
    if (urlResolver) {
      url = urlResolver.resolveUrl(url) || url
    }
    const el = $$('img', { class: 'sc-image', 'data-id': node.id, onerror: this._onError })
    if (url) {
      el.setAttribute('src', url)
    } else {
      if (placeholder) {
        el.setAttribute('src', placeholder)
      }
      el.addClass('sm-empty')
    }
    if (errored) {
      el.attr({ title: 'Could not load image.' })
      el.addClass('sm-error')
    }
    return el
  }

  _onError () {
    this.extendState({ errored: true })
  }
}
