'use strict';

var oo = require('../util/oo');
var EventEmitter = require('../util/EventEmitter');


/**
  A document selection. Refers to a Substance document model, not to the DOM.

  Implemented by {@link model/PropertySelection} and {@link model/ContainerSelection}

  @class
  @abstract
*/

function Selection() {}

Selection.Prototype = function() {
  /**
    Get all ranges of a selection.
  */
  this.getRanges = function() {
    return [];
  };

  /**
    Returns true when selection is null.
  */
  this.isNull = function() {
    return false;
  };

  /**
    Returns true when selection consists of multiple ranges
  */
  this.isMultiSeletion = function() {
    return false;
  };

  /**
    Returns true for property selections
  */
  this.isPropertySelection = function() {
    return false;
  };

  /**
    Returns true if selection is a {@link model/ContainerSelection}
  */
  this.isContainerSelection = function() {
    return false;
  };

  /**
    Returns true if selection is a {@link model/TableSelection}
  */
  this.isTableSelection = function() {
    return false;
  };

  /**
    Returns true when selection is collapsed
  */
  this.isCollapsed = function() {
    return true;
  };

  /**
    Returns true if startOffset < endOffset
  */
  this.isReverse = function() {
    return false;
  };

  /**
    Returns true if selection equals `other` selection
  */
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

  /**
    Describes selection as human readable string
  */
  this.toString = function() {
    return "null";
  };

};

oo.initClass(Selection);

/**
  Class to represent null selections.

  @class
*/

Selection.NullSelection = function() {};

Selection.NullSelection.Prototype = function() {
  this.isNull = function() {
    return true;
  };
};

Selection.extend(Selection.NullSelection);

/**
  We use a singleton to represent NullSelections.
  @type {model/Selection.NullSelection}
*/

Selection.nullSelection = Object.freeze(new Selection.NullSelection());


/**
  A selection fragment. Used when we need to break down a {@link model/ContainerAnnotation}
  into their fragments, each corresponding to a property selection.

  @class Selection.Fragment
*/

Selection.Fragment = function(type, path, startOffset, endOffset) {
  EventEmitter.call(this);

  this.type = type;
  this.path = path;
  this.startOffset = startOffset;
  this.endOffset = endOffset || startOffset;

  // Note: this is necessary for the fragmentation algorithm to
  // know that a cursor should be closed instantly (like a self-closing tag)
  if (type === 'cursor') {
    this.zeroWidth = true;
  }
};

EventEmitter.extend(Selection.Fragment);

Object.defineProperties(Selection.Fragment.prototype, {
  offset: {
    get: function() { return this.startOffset; }
  },
  id: {
    get: function() {
      return this.type;
    }
  }
});

module.exports = Selection;
