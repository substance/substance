'use strict';

var Substance = require('../basics');

function Selection() {
}

Selection.Prototype = function() {

  this.getRanges = function() {
    return [];
  };

  this.isNull = function() {
    return false;
  };

  this.isMultiSeletion = function() {
    return false;
  };

  this.isPropertySelection = function() {
    return false;
  };

  this.isContainerSelection = function() {
    return false;
  };

  this.isTableSelection = function() {
    return false;
  };

  this.isCollapsed = function() {
    return true;
  };

  this.isReverse = function() {
    return false;
  };

  this.equals = function(other) {
    if (this === other) {
      return true ;
    } else if (!other) {
      return false;
    } else if (this.isNull() !== other.isNull()) {
      return false;
    } else {
      return true;
    }
  };

  this.toString = function() {
    return "null";
  };

};

Substance.initClass(Selection);

var NullSelection = function() {};
NullSelection.Prototype = function() {
  this.isNull = function() {
    return true;
  };
};
Substance.inherit(NullSelection, Selection);
Selection.nullSelection = Object.freeze(new NullSelection());

module.exports = Selection;
