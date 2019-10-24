import { Component, $$ } from '../dom'
import { keys, parseKeyEvent } from '../util'

export default class ModalCanvas extends Component {
  getActionHandlers () {
    return {
      cancel: this._cancel,
      confirm: this._confirm
    }
  }

  render () {
    const { renderModal } = this.state
    const el = $$('div', { class: 'sc-modal-canvas' })
    if (renderModal) {
      el.append(
        renderModal().ref('renderedModal')
      )
      el.on('keydown', this._onKeydown)
    }
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
  }

  _confirm () {
    this._resolve(this.refs.renderedModal)
    this._resolve = null
    this.setState({})
  }

  _onKeydown (event) {
    event.stopPropagation()
    // TODO: this is only working if the modal content has focus
    // we would need to add a global handler, or add a keytrap
    switch (event.keyCode) {
      case keys.ESCAPE: {
        this.close()
        break
      }
      case keys.ENTER: {
        const combo = parseKeyEvent(event, true)
        if (combo === 'META' || combo === 'ALT') {
          this._confirm()
        }
        break
      }
      default:
        //
    }
  }
}
