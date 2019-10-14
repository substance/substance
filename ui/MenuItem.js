import { $$ } from '../dom'
import Button from './Button'
import Icon from './Icon'
import StackFill from './StackFill'

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

    const elements = [
      $$('div', { class: 'se-icon' },
        icon
          ? $$(Icon, { icon })
          : null
      ),
      $$('div', { class: 'se-label' }, label)
    ]

    if (shortcut) {
      $$(StackFill)
      elements.push($$('div', { class: 'se-shortcut' }, shortcut))
    }

    el.append(
      ...elements
    )
    el.on('click', this._onClick)
    return el
  }
}
