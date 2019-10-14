import { Component, $$ } from '../dom'
import { renderProperty } from '../editor'

export default class FigureComponent extends Component {
  render () {
    const { node } = this.props
    const { urlResolver } = this.context
    const el = $$('div', { class: 'sc-figure' })
    let url = node.image
    if (urlResolver) {
      url = urlResolver.resolveUrl(url)
    }
    el.append(
      $$('img', { src: url })
    )
    el.append(
      renderProperty(this, node, 'legend', { placeholder: 'Enter caption' })
        .addClass('se-legend')
    )
    return el
  }
}
