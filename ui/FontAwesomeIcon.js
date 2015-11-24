'use strict';

var Component = require('./Component');
var $$ = Component.$$;

function FontAwesomeIcon() {
  Component.Container.apply(this, arguments);
}

FontAwesomeIcon.Prototype = function() {
  this.render = function() {
    return $$('i').addClass('fa ' + this.props.icon);
  };
};

Component.Container.extend(FontAwesomeIcon);

module.exports = FontAwesomeIcon;