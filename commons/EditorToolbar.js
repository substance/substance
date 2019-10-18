import { Component, $$ } from '../dom'
import { renderMenu } from '../ui'

export default class EditorToolbar extends Component {
  render () {
    return $$('div', { class: 'sc-editor-toolbar' }).append(
      renderMenu(this, 'editor-toolbar')
    )
  }
}
