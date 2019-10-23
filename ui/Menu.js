import { $$, Component } from '../dom'

export default class Menu extends Component {
  render () {
    const { children, noIcons } = this.props

    const el = $$('div', { class: 'sc-menu' })
    if (noIcons) {
      el.addClass('sm-no-icons')
    }
    el.append(children)

    return el
  }
}
