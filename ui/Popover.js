import { Component, $$, DefaultDOMElement, domHelpers } from '../dom'
import { isFunction, platform, uuid } from '../util'
import renderMenu from './renderMenu'

export default class Popover extends Component {
  getInitialState () {
    return { content: null, requester: null, desiredPos: null }
  }

  didMount () {
    if (platform.inBrowser) {
      DefaultDOMElement.getBrowserWindow().on('mousedown', this._onGlobalMousedown, this, { capture: true })
      DefaultDOMElement.getBrowserWindow().on('mouseup', this._onGlobalMouseup, this, { capture: true })
    }
  }

  dispose () {
    if (platform.inBrowser) {
      DefaultDOMElement.getBrowserWindow().off(this)
    }
  }

  render () {
    const { content, requester } = this.state
    const el = $$('div', { class: 'sc-popover sm-hidden' })
    if (requester) {
      // Note: content can either be given as menu spec or as a render function
      if (isFunction(content)) {
        const renderContent = content
        el.append(
          renderContent()
        )
      // default: content is given as menu spec
      } else {
        el.append(
          renderMenu(requester, content)
        )
      }
    }
    return el
  }

  /**
   * Request to render a popover, given either a menu specification or a render function,
   * at the given position.
   *
   * To receive actions, the requesting component has to be provided.
   *
   * @param {object} params
   * @param {Function|object} params.content - a render function or a menu specification (see renderMenu)
   * @param {object} params.desiredPos
   * @param {number} params.desiredPos.x - the desired x screen coordinate
   * @param {number} params.desiredPos.y - the desired y screen coordinate
   * @param {Component} [params.requester] - the component that is requesting the content; this is used to dispatch actions
   */
  acquire (params, scrollable) {
    // console.log('Popover.acquire()', requester)
    this._checkParams(params)

    this.setState(Object.assign({ requestId: uuid(), scrollable }, params))

    // ATTENTION: we have to postpone showing the content
    // as otherwise, e.g. the DOM selection is not yet updated,
    // which is needed for positioning
    setTimeout(() => {
      this._showPopover()
    }, 0)

    return true
  }

  release (requester) {
    if (this.state.requester === requester) {
      // console.log('Popover.release()', requester)
      this._hide()
    }
  }

  close () {
    // console.log('Popover.close()')
    this._hide()
  }

  isOpen () {
    return Boolean(this.state.requester)
  }

  _checkParams (params) {
    if (!params.content) throw new Error("'params.content' is required")
    if (!params.desiredPos) throw new Error("'desiredPos' is required")
  }

  _showPopover () {
    const { desiredPos, scrollable } = this.state
    const el = this.getElement()
    const bounds = this._getBounds()
    // console.log('bounds', bounds, 'desiredPos', desiredPos)

    // TODO: we should do some positioning here to stay within the screen/container bounds
    const menuWidth = el.htmlProp('offsetWidth')
    // By default, context menu are aligned left bottom to the desired coordinate
    let leftPos = bounds.x + desiredPos.x - menuWidth / 2
    // Must not exceed left bound
    leftPos = Math.max(leftPos, 0)
    // Must not exceed right bound
    const maxLeftPos = bounds.right - menuWidth
    leftPos = Math.min(leftPos, maxLeftPos)
    const topPos = desiredPos.y - bounds.y
    const maxHeight = bounds.bottom - topPos

    // store topPos and leftPos so that we can do repositioning on scroll
    if (scrollable) {
      this._topPos = topPos
      this._leftPos = leftPos
      this._initialScrollTop = scrollable.getProperty('scrollTop')
      this._initialScrollLeft = scrollable.getProperty('scrollLeft')
    }

    el.css({
      top: topPos,
      left: leftPos,
      'max-height': maxHeight
    })
    el.removeClass('sm-hidden')
    this._visible = true
  }

  _getBounds () {
    if (platform.inBrowser) {
      let containerEl
      if (this.props.getContainer) {
        containerEl = this.props.getContainer().getNativeElement()
      } else {
        containerEl = window.document
      }
      return containerEl.getBoundingClientRect()
    } else {
      return { left: 0, top: 0, bottom: 0, right: 0 }
    }
  }

  // overriding the default send() mechanism to be able to dispatch actions to the current requester
  _doesHandleAction () {
    return Boolean(this.state.requester)
  }

  _handleAction (action, args) {
    // console.log('FORWARDING action to requester', action, args)
    this.state.requester.send(action, ...args)
    // TODO: think if this is really what we want, i.e. hiding the menu whenever an action is emitted
    // console.log('Popover._handleAction(): hiding popover')
    this._hide()
  }

  _onGlobalMousedown () {
    // Note: we auto hide on every click
    // except those that occur inside the popover
    // and those that are 'white-listed' via params.allowClickInsideOf
    this._lastRequestId = this.state.requestId
  }

  _onGlobalMouseup (e) {
    if (!this._visible) return

    const targetEl = DefaultDOMElement.wrap(e.target)
    // do not auto-close if clicked inside the popover
    if (domHelpers.hasAncestor(targetEl, this.getElement())) {
      return
    }
    // Additionally, allow to skip auto-closing if clicked insied of a given element
    // e.g. QuerySelect has an input, that has a dropdown attached. Clicking into the input
    // should not auto-close the dropdown.
    if (this.state.allowClickInsideOf) {
      if (domHelpers.hasAncestor(targetEl, this.state.ignoreClicksInside)) {
        // console.log('Ignoring click because it is inside of a white-listed element')
        return
      }
    }
    const lastRequestId = this._lastRequestId
    const currentRequestId = this.state.requestId
    if (lastRequestId === currentRequestId) {
      this._hide()
    }
  }

  _hide () {
    // console.log('Hiding')
    const requester = this.state.requester
    if (requester && requester.onClosePopover) {
      requester.onClosePopover()
    }
    this.setState(this.getInitialState())
    this._visible = false
  }

  /**
   * ATTENTION: this method has to be called by the owner whenever the scrollable
   * has been scrolled.
   */
  reposition (scrollable) {
    // Note: we use this for different kinds of popovers
    // typically, only context menus or alike require a 'relative' positioning
    if (this.state.position === 'relative') {
      const dtop = scrollable.getProperty('scrollTop') - this._initialScrollTop
      const dleft = scrollable.getProperty('scrollLeft') - this._initialScrollLeft
      this.el.css({
        top: this._topPos - dtop,
        left: this._leftPos + dleft
      })
    }
  }
}
