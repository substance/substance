'use strict';

var oo = require('../util/oo');

/**
 Default label provider implementation
*/

var LabelProvider = function(labels, lang) {
  this.lang = lang || 'en';
  this.labels = labels;
};

LabelProvider.Prototype = function() {

  this.getLabel = function(name) {
    var labels = this.labels[this.lang];
    if (!labels) return name;
    return labels[name] || name;
  };
};

oo.initClass(LabelProvider);

module.exports = LabelProvider;
