'use strict';

var oo = require('../util/oo');
var Icon = require('./FontAwesomeIcon');

// Maps app identifiers to FontAwesome icon classes
var ICON_MAP = {
  'link': 'fa-link',
  'strong': 'fa-bold',
  'emphasis': 'fa-italic',
  'save': 'fa-save',
  'image': 'fa-image',
  'undo': 'fa-undo',
  'redo': 'fa-repeat'
};

function IconProvider() {

}

IconProvider.Prototype = function() {
  this.renderIcon = function($$, name) {
    return $$(Icon, {icon: ICON_MAP[name]});
  };
};

oo.initClass(IconProvider);

module.exports = IconProvider;
