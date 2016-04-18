'use strict';

var Component = require('./Component');

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
  this._closeModal = function(e) {
    var closeSurfaceClick = e.target.classList.contains('sc-modal');
    if (closeSurfaceClick) {
      this.send('closeModal');
    }
  };

  this.render = function($$) {
    var el = $$('div').addClass('sc-modal');
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
};

Component.extend(Modal);
module.exports = Modal;