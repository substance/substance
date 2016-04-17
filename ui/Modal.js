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

  this.render = function($$) {
    var el = $$('div').addClass('sc-modal');
    el.addClass('sm-width-'+this.props.width);

    el.append(this.props.children);
    return el;
  };
};

Component.extend(Modal);
module.exports = Modal;