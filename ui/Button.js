'use strict';

import Component from './Component'

function Button() {
  Component.apply(this, arguments);
}

Button.Prototype = function() {

  this.render = function($$) {
    var el = $$('button').addClass('sc-button');
    el.append(this.props.children);
    if (this.props.disabled) {
      el.attr({disabled: 'disabled'});
    }
    return el;
  };
};

Component.extend(Button);
export default Button;