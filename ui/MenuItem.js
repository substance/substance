import { $$ } from '../dom'
import Button from './Button'
import Icon from './Icon'
// import StackFill from './StackFill'

export default class MenuItem extends Button {
  render () {
    const { icon, label, shortcut } = this.props
    const active = this.props.active
    const disabled = this.props.disabled
    const el = $$('button', { class: 'sc-menu-item' })
    if (disabled) {
      el.attr('disabled', true)
    }
    if (active) {
      el.addClass('sm-active')
    }

    el.append(
      $$('div', { class: 'se-icon' },
        icon
          ? $$(Icon, { icon })
          : null
      )
    )

    el.append(
      $$('div', { class: 'se-label' }, label)
    )

    if (shortcut) {
      el.append(
        // $$(StackFill),
        $$('div', { class: 'se-shortcut' }, shortcut)
      )
    }

    el.on('click', this._onClick)

    return el
  }
}
