'use strict';

import Component from './Component'

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
function Modal() {
  Component.apply(this, arguments);
}

Modal.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('sc-modal');

    // TODO: don't think that this is good enough. Right the modal is closed by any unhandled click.
    // Need to be discussed.
    el.on('click', this._closeModal);

    if (this.props.width) {
      el.addClass('sm-width-'+this.props.width);
    }

    el.append(
      $$('div').addClass('se-body').append(
        this.props.children
      )
    );
    return el;
  };

  this._closeModal = function(e) {
    var closeSurfaceClick = e.target.classList.contains('sc-modal');
    if (closeSurfaceClick) {
      this.send('closeModal');
    }
  };

};

Component.extend(Modal);
export default Modal;