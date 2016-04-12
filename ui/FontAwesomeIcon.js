'use strict';

var Component = require('./Component');

function FontAwesomeIcon() {
  FontAwesomeIcon.super.apply(this, arguments);
}

FontAwesomeIcon.Prototype = function() {

  this.render = function($$) {
    return $$('i').addClass('fa ' + this.props.icon);
  };

};

Component.extend(FontAwesomeIcon);

module.exports = FontAwesomeIcon;