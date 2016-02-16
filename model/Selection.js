'use strict';

var oo = require('../util/oo');
var EventEmitter = require('../util/EventEmitter');
var Anchor = require('./Anchor');

/**
  A document selection. Refers to a Substance document model, not to the DOM.

  Implemented by {@link model/PropertySelection} and {@link model/ContainerSelection}

  @class
  @abstract
*/

function Selection() {}

Selection.Prototype = function() {

  /**
    @returns {Boolean} true when selection is null.
  */
  this.isNull = function() {
    return false;
  };

  /**
    @returns {Boolean} true for property selections
  */
  this.isPropertySelection = function() {
    return false;
  };

  /**
    @returns {Boolean} true if selection is a {@link model/ContainerSelection}
  */
  this.isContainerSelection = function() {
    return false;
  };

  /**
    @returns {Boolean} true if selection is a {@link model/TableSelection}
  */
  this.isTableSelection = function() {
    return false;
  };

  this.isNodeSelection = function() {
    return false;
  };

  /**
    @returns {Boolean} true when selection is collapsed
  */
  this.isCollapsed = function() {
    return true;
  };

  /**
    @returns {Boolean} true if startOffset < endOffset
  */
  this.isReverse = function() {
    return false;
  };

  /**
    @returns {Boolean} true if selection equals `other` selection
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
    @returns {String} This selection as human readable string.
  */
  this.toString = function() {
    return "null";
  };

  /**
    @private
    @returns {Range[]} All ranges of a selection.
  */
  this.getRanges = function() {
    return [];
  };

  /**
    Attach document to the selection.

    @private
    @param {Document} doc document to attach
    @returns {this}
  */
  this.attach = function(doc) {
    /* jshint unused: false */
    throw new Error('This method is abstract.');
  };


  /**
    Convert container selection to JSON.

    @abstract
    @returns {Object}
  */
  this.toJSON = function() {
    throw new Error('This method is abstract.');
  };

};

oo.initClass(Selection);

/**
  Class to represent null selections.

  @private
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

  @type {model/Selection}
*/

Selection.nullSelection = Object.freeze(new Selection.NullSelection());


/**
  A selection fragment. Used when we split a {@link model/ContainerSelection}
  into their fragments, each corresponding to a property selection.

  @private
  @class
*/

Selection.Fragment = function(path, startOffset, endOffset) {
  EventEmitter.call(this);

  this.type = "selection-fragment";
  this.path = path;
  this.startOffset = startOffset;
  this.endOffset = endOffset || startOffset;
};

Selection.Fragment.Prototype = function() {

  this.isAnchor = function() {
    return false;
  };

  this.isInline = function() {
    return false;
  };

};

EventEmitter.extend(Selection.Fragment);

/**
  Describe the cursor when creating selection fragments.
  This is used for rendering selections.

  @private
  @class
  @extends Anchor
*/
Selection.Cursor = function(path, offset) {
  Anchor.call(this, path, offset);
  this.type = "cursor";
};

Anchor.extend(Selection.Cursor);

module.exports = Selection;
