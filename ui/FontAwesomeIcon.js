'use strict';

var OO = require('../util/oo');
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

OO.inherit(FontAwesomeIcon, Component.Container);

module.exports = FontAwesomeIcon;
