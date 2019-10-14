import { $$, Component } from '../dom'
import { platform } from '../util'

/**
 * Acts like a link if `url` is provided. Sends an action if `action` is
 * provided. Uses default behaviour if none of both provided.
 *
 * Examples:
 *
 * ```
 * $$(Button, { style: 'primary', action: 'createVersion' }, 'Create Version')
 * $$(Button, { style: 'primary', size: 'large', url: '/login' }, 'Login')
 * $$(Button, { style: 'primary', size: 'large' }, 'Request login link')
 * $$(Button, { style: 'default', size: 'large', action: 'closeModal' }, 'Cancel')
 * $$(Button, { style: 'default', size: 'small', action: 'replaceImage' }, 'Replace Image')
 * ```
 */
export default class Button extends Component {
  _getClass () {
    return 'sc-button'
  }

  render () {
    const { children, active, disabled } = this.props
    const size = this.props.size || 'default'
    const style = this.props.style || 'default'

    const el = $$('button', { class: this._getClass() })
      .addClass('sm-style-' + style)
      .addClass('sm-size-' + size)
    if (disabled) {
      el.attr('disabled', true)
    }
    if (active) {
      el.addClass('sm-active')
    }
    if (disabled) {
      el.append($$('span', { class: 'se-blocker' }))
    } else {
      el.on('click', this._onClick)
    }
    el.append(children)
    return el
  }

  _onClick (event) {
    const { url, action, newTab, args } = this.props
    if (url && platform.inBrowser) {
      event.preventDefault()
      event.stopPropagation()
      if (newTab) return window.open(url)
      window.location.href = url
    } else if (action) {
      event.preventDefault()
      event.stopPropagation()
      // send position arguments if 'args' is specified
      const _args = args || [this.props]
      this.send(action, ..._args)
    }
  }
}
