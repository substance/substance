import { $$, Component } from '../dom'
import { platform } from '../util'
import Button from './Button'
import Icon from './Icon'
import HorizontalSpace from './HorizontalSpace'

export default class Dropdown extends Component {
  render () {
    const { disabled, children, hideWhenDisabled, noCaret } = this.props

    const buttonProps = this._getToggleButtonProps()
    const buttonEl = $$(Button, buttonProps).addClass('sc-dropdown')
    if (!disabled) {
      buttonEl.on('click', this._onClick)
    }

    function _addHorizontalSpaceIfNecessary () {
      if (buttonEl.children.length > 0) buttonEl.append($$(HorizontalSpace))
    }
    // Either children are given via props
    // or we render content derived from icon, label, etc.
    if (children && children.length > 0) {
      buttonEl.append(children)
    } else {
      const { icon, label, size, tooltip } = buttonProps
      if (icon) {
        buttonEl.append(
          $$(Icon, { icon, size })
        )
      }
      if (label) {
        _addHorizontalSpaceIfNecessary()
        buttonEl.append(
          label
        )
      }
      if (tooltip) {
        buttonEl.attr('title', tooltip)
      }

      if (!noCaret) {
        _addHorizontalSpaceIfNecessary()
        buttonEl.append(
          $$(Icon, { icon: 'caret-down' })
        )
      }
    }

    if (disabled && hideWhenDisabled) {
      buttonEl.addClass('sm-hidden')
    }

    return buttonEl
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
      this.send('requestPopover', {
        requester: this,
        desiredPos: { x, y },
        items: this.props.items
      })
    }
  }
}
