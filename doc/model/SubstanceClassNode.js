'use strict';

var ClassNode = require('./ClassNode');
var find = require('lodash/find');

function SubstanceClassNode() {
  SubstanceClassNode.super.apply(this, arguments);
}

SubstanceClassNode.Prototype = function() {

  // Defaults to the regular type property
  this.getSpecificType = function() {
    var isComponent = false;
    if (this.tags.length > 0) {
      isComponent = Boolean(find(this.tags, 'type', 'component'));
    }

    if (isComponent) {
      return this.isAbstract ? 'abstract-component': 'component';
    } else {
      return ClassNode.prototype.getSpecificType.call(this);
    }
  };

};

ClassNode.extend(SubstanceClassNode);

module.exports = SubstanceClassNode;
