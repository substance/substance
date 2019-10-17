import { Component, $$ } from '../dom'
import { renderMenu, Limiter } from '../ui'

export default class EditorToolbar extends Component {
  render () {
    const { fullscreen } = this.props
    return $$('div', { class: 'sc-toolbar' }).append(
      $$(Limiter, { fullscreen },
        renderMenu(this, 'editor-toolbar')
      )
    )
  }
}
