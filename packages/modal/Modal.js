import { Component } from '../../ui'

/**
  Modal dialog component

  @class
  @component

  @prop {String} width 'small', 'medium', 'large' and 'full'

  @example

  ```js
  var form = $$(Modal, {
    width: 'medium',
    textAlign: 'center'
  });
  ```
*/
class Modal extends Component {

  render($$) {
    let el = $$('div').addClass('sc-modal')

    // TODO: don't think that this is good enough. Right the modal is closed by any unhandled click.
    // Need to be discussed.
    el.on('click', this._closeModal)

    if (this.props.width) {
      el.addClass('sm-width-'+this.props.width)
    }

    el.append(
      $$('div').addClass('se-body').append(
        this.props.children
      )
    )
    return el
  }

  _closeModal(e) {
    let closeSurfaceClick = e.target.classList.contains('sc-modal')
    if (closeSurfaceClick) {
      this.send('closeModal')
    }
  }

}

export default Modal
