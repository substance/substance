'use strict';

var ClassNode = require('./ClassNode');
var find = require('lodash/collection/find');

var SubstanceClassNode = ClassNode.extend({
  // Defaults to the regular type property
  getSpecificType: function() {
    var isComponent = false;
    if (this.tags.length > 0) {
      isComponent = !!find(this.tags, 'type', 'component');
    }

    if (isComponent) {
      return this.isAbstract ? 'abstract-component': 'component';
    } else {
      return ClassNode.prototype.getSpecificType.call(this);
    }
  }
});

module.exports = SubstanceClassNode;
