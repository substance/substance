import { $$ } from '../dom'
import NodeComponent from './NodeComponent'

export default class ImageComponent extends NodeComponent {
  getInitialState () {
    this._url = this._getUrl()
  }

  render () {
    const { errored } = this.state
    const { node, placeholder } = this.props
    const el = $$('img', { class: 'sc-image', 'data-id': node.id, onerror: this._onError })
    if (this._url) {
      el.setAttribute('src', this._url)
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

  _getUrl () {
    const node = this.props.node
    const urlResolver = this.context.urlResolver
    let url = null
    if (urlResolver) {
      url = urlResolver.resolveUrl(node.src) || node.src
    }
    return url
  }

  _onNodeUpdate (change) {
    const newUrl = this._getUrl()
    if (newUrl !== this._url) {
      this._url = newUrl
      this.rerender()
    }
  }

  _onError () {
    this.extendState({ errored: true })
  }
}
