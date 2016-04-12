var Component = require('./Component');
var $$ = Component.$$;

function Input() {
  Component.apply(this, arguments);
}

Input.Prototype = function() {

  this.render = function() {
    var el = $$('input').attr({
      value: this.props.value,
      type: this.props.type,
      placeholder: this.props.placeholder
    })
    .addClass('sc-input');

    if (this.props.centered) {
      el.addClass('sm-centered');
    }

    return el;
  };
};

Component.extend(Input);
module.exports = Input;