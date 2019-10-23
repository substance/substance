import { $$, Component } from '../dom'
import { platform } from '../util'
import Button from './Button'
import Icon from './Icon'
import HorizontalSpace from './HorizontalSpace'

export default class DropdownMenu extends Component {
  render () {
    const { disabled, children, hideWhenDisabled, noCaret, noIcons } = this.props

    const buttonProps = this._getToggleButtonProps()
    const el = $$(Button, buttonProps).addClass('sc-dropdown-menu')
    // Note: want to inherit style from Menu
    el.addClass('sc-menu')
    if (noIcons) {
      el.addClass('sm-no-icons')
    }
    if (!disabled) {
      el.on('click', this._onClick)
    }

    function _addHorizontalSpaceIfNecessary () {
      if (el.children.length > 0) el.append($$(HorizontalSpace))
    }
    // Either children are given via props
    // or we render content derived from icon, label, etc.
    if (children && children.length > 0) {
      el.append(children)
    } else {
      const { icon, label, size, tooltip } = buttonProps
      if (icon) {
        el.append(
          $$(Icon, { icon, size })
        )
      }
      if (label) {
        _addHorizontalSpaceIfNecessary()
        el.append(
          label
        )
      }
      if (tooltip) {
        el.attr('title', tooltip)
      }

      if (!noCaret) {
        _addHorizontalSpaceIfNecessary()
        el.append(
          $$(Icon, { icon: 'caret-down' })
        )
      }
    }

    if (disabled && hideWhenDisabled) {
      el.addClass('sm-hidden')
    }

    return el
  }

  _getToggleButtonProps () {
    const { disabled, style, size, icon, label, tooltip } = this.props
    return {
      disabled,
      style: style || 'plain',
      size,
      icon,
      label,
      tooltip,
      dropdown: true
    }
  }

  _onClick () {
    if (platform.inBrowser) {
      let { x, y, height, width } = this.getNativeElement().getBoundingClientRect()
      y = y + height + 5
      x = x + width / 2
      const menuSpec = Object.assign({}, this.props, { type: 'menu' })
      this.send('requestPopover', {
        requester: this,
        desiredPos: { x, y },
        content: menuSpec
      })
    }
  }
}
