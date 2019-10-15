import { Component, $$, DefaultDOMElement } from '../dom'
import { getRelativeMouseBounds, isArray, isEqual, isFunction } from '../util'
import renderMenu from './renderMenu'

export default class Popover extends Component {
  getInitialState () {
    return { content: null, requester: null, desiredPos: null }
  }

  render () {
    const { content, requester } = this.state
    const el = $$('div', { class: 'sc-menu sm-hidden' })
    if (requester) {
      // content given as menu items
      if (isArray(content)) {
        el.append(
          renderMenu(requester, { type: 'menu', items: content })
        )
      } else if (isFunction(content)) {
        const renderContent = content
        el.append(
          renderContent()
        )
      }
    }
    return el
  }

  acquire (params) {
    const { requester, desiredPos } = params
    if (!requester) throw new Error("'requester' is required")
    if (!desiredPos) throw new Error("'desiredPos' is required")

    // NOTE: this implements a toggle behavior. I.e. if the same requester
    // requests the popover for the same position, then we hide the popover
    const state = this.state
    if (state.requester === requester && isEqual(desiredPos, state.desiredPos)) {
      this._hide()
      return
    }

    // Note: this prevents a potentially triggered hide, if a new popover request has come in
    this._hideIfNoNewRequest = false

    // We started with this implementation
    let content
    if (params.items) {
      let items = params.items
      // if this is called with a menu spec
      if (!isArray(items) && items.items) {
        items = items.items
      }
      if (items.length === 0) return
      content = items
    // Experimental: rendering popover content using a render hook
    } else if (params.render) {
      content = params.render
    } else {
      throw new Error('Illegal arguments.')
    }
    // HACK adding a delay so that other things, e.g. selection related can be done first
    setTimeout(() => {
      this._showContent(content, requester, desiredPos)
    }, 0)
  }

  release (requester) {
    if (this.state.requester === requester) {
      this._hide()
    }
  }

  _showContent (content, requester, desiredPos) {
    this.setState({ content, requester, desiredPos })
    const el = this.getElement()
    // TODO: we could do some positioning here to stay within the container bounds
    // TODO: getRelativeMouseBounds() is not the right name for us here
    // but the logic is what we need
    const bounds = getRelativeMouseBounds({ clientX: desiredPos.x, clientY: desiredPos.y }, this.props.container.getNativeElement())
    const menuWidth = el.htmlProp('offsetWidth')
    // By default, context menu are aligned left bottom to the mouse coordinate clicked
    let leftPos = bounds.left - menuWidth / 2
    // Must not exceed left bound
    leftPos = Math.max(leftPos, 0)
    // Must not exceed right bound
    const maxLeftPos = bounds.left + bounds.right - menuWidth
    leftPos = Math.min(leftPos, maxLeftPos)
    el.css({
      top: bounds.top,
      left: leftPos
    })
    el.removeClass('sm-hidden')
    // NOTE: this is a tricky mechanism trying to detect any mousedowns outside of the context menu
    // used to close the context menu.
    // If clicked inside the popover it will not close automatically, only if clicked somewhere else
    // or if one of the rendered popover content sends an action.
    this._closeOnClick = true
    el.on('mousedown', this._onMousedownInside, this, { once: true, capture: true })
    // making sure that there is only one active listener
    if (!this._hasGlobalMousedownListener) {
      DefaultDOMElement.getBrowserWindow().on('click', this._onMousedownOutside, this, { once: true, capture: true })
      this._hasGlobalMousedownListener = true
    }
  }

  // overriding the default send() mechanism to be able to dispatch actions to the current requester
  _doesHandleAction () {
    return true
  }

  _handleAction (action, args) {
    // console.log('FORWARDING action to requester', action, args)
    this.state.requester.send(action, ...args)
    // TODO: think if this is really what we want, i.e. hiding the menu whenever an action is emitted
    this._hide()
  }

  _onMousedownInside () {
    this._closeOnClick = false
  }

  _onMousedownOutside () {
    this._hasGlobalMousedownListener = false
    // NOTE: this timeout is necessary so that an actual click can be handled
    // e.g. requesting to show the popover at a different location, or
    // with different content
    // In that case we do not want to hide
    if (this._closeOnClick) {
      this._hideIfNoNewRequest = true
      // HACK waiting two ticks because the request itself
      setTimeout(() => {
        if (this._hideIfNoNewRequest) {
          this._hide()
        }
      }, 0)
    }
  }

  _hide () {
    // console.log('Hiding')
    this.setState(this.getInitialState())
  }
}
