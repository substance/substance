'use strict';

var oo = require('../util/oo');
var _ = require('../util/helpers');

function I18n() {
  this.map = {};
}

I18n.Prototype = function() {
  this.t = function(key) {
    if (this.map[key]) {
      return this.map[key];
    } else {
      return key;
    }
  };
  this.load = function(map) {
    _.extend(this.map, map);
  };
};

oo.initClass(I18n);

I18n.mixin = function(ComponentClass) {
  Object.defineProperty(ComponentClass.prototype, 'i18n', {
    get: function() {
      // support for Substance.Components (using dependency injection)
      if (this.context && this.context.i18n) {
        return this.context.i18n;
      }
      // support for usage via singleton
      else {
        return I18n.instance;
      }
    }
  });
};

I18n.instance = new I18n();

module.exports = I18n;
