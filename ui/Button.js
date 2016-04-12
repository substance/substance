var Component = require('./Component');
var $$ = Component.$$;

function Button() {
  Component.apply(this, arguments);
}

Button.Prototype = function() {

  this.render = function() {
    var el = $$('button').addClass('sc-button');
    el.append(this.props.children);
    if (this.props.disabled) {
      el.attr({disabled: 'disabled'});
    }
    return el;
  };
};

Component.extend(Button);
module.exports = Button;