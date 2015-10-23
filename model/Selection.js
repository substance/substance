'use strict';

var _ = require('../util/helpers');
var OO = require('../util/oo');
var EventEmitter = require('../util/EventEmitter');

function Selection() {}

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

OO.initClass(Selection);

var NullSelection = function() {};
NullSelection.Prototype = function() {
  this.isNull = function() {
    return true;
  };
};
OO.inherit(NullSelection, Selection);
Selection.nullSelection = Object.freeze(new NullSelection());

Selection.Fragment = function(type, path, startOffset, endOffset) {
  EventEmitter.call(this);
  this.type = type;
  this.path = path;
  this.startOffset = startOffset;
  this.endOffset = endOffset || startOffset;
};

Selection.Fragment.Prototype = function() {
  _.extend(this, EventEmitter.prototype);
};

OO.initClass(Selection.Fragment);

module.exports = Selection;
