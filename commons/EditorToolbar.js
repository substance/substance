import { Component, $$ } from '../dom'
import { renderMenu, Limiter } from '../ui'

export default class EditorToolbar extends Component {
  render () {
    return $$('div', { class: 'sc-toolbar' }).append(
      $$(Limiter, { fullscreen: true },
        renderMenu(this, 'editor-toolbar')
      )
    )
  }
}
