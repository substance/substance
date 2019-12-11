import { Component, $$, domHelpers } from '../dom'

export default class ModalCanvas extends Component {
  getActionHandlers () {
    return {
      cancel: this._cancel,
      confirm: this._confirm
    }
  }

  render () {
    const { renderModal } = this.state
    const { isMobile } = this.props
    const el = $$('div', { class: 'sc-modal-canvas' })
    if (isMobile) el.addClass('sm-modal-mobile')
    if (renderModal) {
      el.append(
        renderModal().ref('renderedModal')
      )
    }
    // do not let the global context menu handler handle this
    el.on('contextmenu', domHelpers.stopAndPrevent)
    return el
  }

  openModal (renderModal) {
    // if (this._resolve) throw new Error('Previous modal has not been closed.')
    this.setState({ renderModal })
    return new Promise((resolve, reject) => {
      this._resolve = resolve
    })
  }

  close () {
    this._cancel()
  }

  _cancel () {
    this._resolve(null)
    this._resolve = null
    this.setState({})
    this.send('closePopover')
  }

  _confirm () {
    this._resolve(this.refs.renderedModal)
    this._resolve = null
    this.setState({})
    this.send('closePopover')
  }
}
