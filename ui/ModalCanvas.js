import { Component, $$, domHelpers } from '../dom'
import { uuid } from '../util'
import Popover from './Popover'

export default class ModalCanvas extends Component {
  getInitialState () {
    return {
      currentModal: null,
      stack: []
    }
  }

  getActionHandlers () {
    return {
      cancel: this._cancel,
      confirm: this._confirm,
      requestPopover: this._requestPopover,
      releasePopover: this._releasePopover,
      repositionPopover: this._repositionPopover,
      closePopover: this._closePopover
    }
  }

  getChildContext () {
    return {
      modalCanvas: this
    }
  }

  render () {
    const { currentModal, stack } = this.state
    const { isMobile } = this.props
    const className = 'sc-modal-canvas'
    const el = $$('div', { class: className })
    if (isMobile) el.addClass('sm-mobile')
    if (currentModal) {
      el.append(
        $$('div', { class: 'se-current-modal' }).append(
          currentModal.render().ref(currentModal.id)
        ).ref('container'),
        ...stack.map(stackedModal => {
          return $$('div', { class: 'se-stacked-modal' }).append(
            stackedModal.render().ref(stackedModal.id)
          )
        }),
        $$(Popover, {
          getContainer: () => {
            return this.refs.container.getElement()
          }
        }).ref('popover')
      )
      el.on('mousedown', this._onMousedownCapture, this, { capture: true })
      el.on('mouseup', this._onMouseup)
    } else {
      el.addClass('sm-hidden')
    }
    // do not let the global context menu handler handle this
    el.on('contextmenu', domHelpers.stopAndPrevent)
    return el
  }

  openModal (renderModal) {
    const { currentModal, stack } = this.state
    // if (this._resolve) throw new Error('Previous modal has not been closed.')
    return new Promise((resolve, reject) => {
      const newState = {
        currentModal: {
          id: uuid(),
          render: renderModal,
          resolve
        },
        stack: currentModal ? stack.concat(currentModal) : []
      }
      this.setState(newState)
    })
  }

  close () {
    this._cancel()
  }

  _cancel () {
    const { currentModal } = this.state
    currentModal.resolve(null)
    this._close()
  }

  _confirm () {
    const { currentModal } = this.state
    currentModal.resolve(this.refs[currentModal.id])
    this._close()
  }

  _close () {
    // console.log('Closing modal')
    // HACK: making sure that any popover requested in this modal is closed
    this.refs.popover.close()
    this._pop()
  }

  _onMousedownCapture (event) {
    this._handleMouseup = false
    if (event.target === this.getNativeElement()) {
      this._handleMouseup = true
    }
  }

  _onMouseup (event) {
    if (this._handleMouseup) {
      if (event.target === this.getNativeElement()) {
        this.close()
      }
    }
  }

  _pop () {
    const stack = this.state.stack.slice()
    if (stack.length > 0) {
      const currentModal = stack.pop()
      const newState = {
        currentModal,
        stack
      }
      this.setState(newState)
    } else {
      // Note: this 'closes' the modal by emptying the canvas
      this.setState(this.getInitialState())
    }
  }

  _requestPopover (...args) {
    return this.refs.popover.acquire(...args)
  }

  _releasePopover (...args) {
    return this.refs.popover.release(...args)
  }

  _repositionPopover (...args) {
    return this.refs.popover.reposition(...args)
  }

  _closePopover (...args) {
    return this.refs.popover.close(...args)
  }
}
