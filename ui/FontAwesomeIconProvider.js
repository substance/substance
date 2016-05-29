'use strict';

var clone = require('lodash/clone');
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
  'redo': 'fa-repeat',
  'subscript': 'fa-subscript',
  'superscript': 'fa-superscript',
  'code': 'fa-code',

  // Annotation modes
  'edit': 'fa-cog',
  'expand': 'fa-arrows-h',
  'truncate': 'fa-arrows-h'
};

function IconProvider() {
  this.map = clone(ICON_MAP);
}

IconProvider.Prototype = function() {

  this.renderIcon = function($$, name) {
    var iconClass = this.map[name];
    if (iconClass) {
      return $$(Icon, {icon:iconClass});
    }
  };

  this.addIcon = function(name, faClass) {
    this.map[name] = faClass;
  };
};

oo.initClass(IconProvider);

module.exports = IconProvider;
