'use strict';

var isEqual = require('lodash/lang/isEqual');
var isNumber = require('lodash/lang/isNumber');
var Selection = require('./Selection');
var Coordinate = require('./Coordinate');
var Range = require('./Range');

/**
  A selection which is bound to a property. Implements {@link model/Selection}.

  @class
  @example

  ```js
  var propSel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 6
  });


*/
function PropertySelection(properties) {
  PropertySelection.super.apply(this);

  var path = properties.path;
  var startOffset = properties.startOffset;
  var endOffset = properties.endOffset || properties.startOffset;
  if (!path || !isNumber(startOffset)) {
    throw new Error('Invalid arguments: `path` and `startOffset` are mandatory');
  }
  this.range = new Range(
    new Coordinate(path, startOffset),
    new Coordinate(path, endOffset)
  );
  this.reverse = properties.reverse;
  this._internal = {};
  Object.freeze(this);
}

PropertySelection.Prototype = function() {
 
  /**
    Convert container selection to JSON.

    @returns {Object}
  */
  this.toJSON = function() {
    return {
      type: 'property',
      path: this.path,
      startOffset: this.startOffset,
      endOffset: this.endOffset,
      reverse: this.reverse
    };
  };

  /**
    Get attached to selection document.

    @returns {Document}
  */
  this.getDocument = function() {
    var doc = this._internal.doc;
    if (!doc) {
      throw new Error('Selection is not attached to a document.');
    }
    return doc;
  };

  /**
    Attach document to a selection.

    @param {Document} doc document to attach
    @returns {Selection}
  */
  this.attach = function(doc) {
    this._internal.doc = doc;
    return this;
  };

  this.isNull = function() {
    return false;
  };

  this.getRanges = function() {
    return [this.range];
  };

  /**
    Get range of a selection.
  */
  this.getRange = function() {
    return this.range;
  };

  this.isCollapsed = function() {
    return this.range.isCollapsed();
  };

  this.isReverse = function() {
    return this.reverse;
  };

  this.isPropertySelection = function() {
    return true;
  };

  this.isMultiSeletion = function() {
    return false;
  };

  this.equals = function(other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      !other.isTableSelection() &&
      this.range.equals(other.range)
    );
  };

  /**
    Collapse a selection to chosen direction.

    @param {String} direction either left of right
    @returns {Selection}
  */
  this.collapse = function(direction) {
    var coor;
    if (direction === 'left') {
      coor = this.range.start;
    } else {
      coor = this.range.end;
    }
    return this.createWithNewRange(coor.offset, coor.offset);
  };

  // Helper Methods
  // ----------------------
  
  /**
    Get path of a selection, e.g. target property where selected data is stored.

    @returns {String[]} path 
  */
  this.getPath = function() {
    return this.range.start.path;
  };

  /**
    Get start of a selection range. 

    @returns {Number} offset 
  */
  this.getStartOffset = function() {
    return this.range.start.offset;
  };

  /**
    Get end of a selection range. 

    @returns {Number} offset 
  */
  this.getEndOffset = function() {
    return this.range.end.offset;
  };

  this.toString = function() {
    return [
      "PropertySelection(", JSON.stringify(this.range.start.path), ", ",
        this.range.start.offset, " -> ", this.range.end.offset,
        (this.reverse?", reverse":""),
        (this.range.start.after?", after":""),
      ")"
    ].join('');
  };

  /**
    Checks if this selection is inside another one.

    @param {Selection} other
    @param {Boolean} [strict] true if should check that it is strictly inside the other
    @returns {Boolean}
  */
  this.isInsideOf = function(other, strict) {
    if (other.isNull()) return false;
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.isInsideOf: delegating to ContainerSelection.contains...');
      return other.contains(this);
    }
    if (strict) {
      return (isEqual(this.path, other.path) &&
        this.start.offset > other.start.offset &&
        this.end.offset < other.end.offset);
    } else {
      return (isEqual(this.path, other.path) &&
        this.start.offset >= other.start.offset &&
        this.end.offset <= other.end.offset);
    }
  };
  
  /**
    Checks if this selection contains another one.

    @param {Selection} other
    @param {Boolean} [strict] true if should check that it is strictly contains the other
    @returns {Boolean}
  */
  this.contains = function(other, strict) {
    if (other.isNull()) return false;
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.contains: delegating to ContainerSelection.isInsideOf...');
      return other.isInsideOf(this);
    }
    if (strict) {
      return (isEqual(this.path, other.path) &&
        this.start.offset < other.start.offset &&
        this.end.offset > other.end.offset);
    } else {
      return (isEqual(this.path, other.path) &&
        this.start.offset <= other.start.offset &&
        this.end.offset >= other.end.offset);
    }
  };

  /**
    Checks if this selection overlaps another one.

    @param {Selection} other
    @param {Boolean} [strict] true if should check that it is strictly overlaps the other
    @returns {Boolean}
  */
  this.overlaps = function(other, strict) {
    if (other.isNull()) return false;
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.overlaps: delegating to ContainerSelection.overlaps...');
      return other.overlaps(this);
    }
    if (!isEqual(this.getPath(), other.getPath())) return false;
    if (strict) {
      return (! (this.startOffset>=other.endOffset||this.endOffset<=other.startOffset) );
    } else {
      return (! (this.startOffset>other.endOffset||this.endOffset<other.startOffset) );
    }
  };

  /**
    Checks if this selection has the right boundary in common with another one.

    @param {Selection} other
    @returns {Boolean}
  */
  this.isRightAlignedWith = function(other) {
    if (other.isNull()) return false;
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.isRightAlignedWith: delegating to ContainerSelection.isRightAlignedWith...');
      return other.isRightAlignedWith(this);
    }
    return (isEqual(this.getPath(), other.getPath()) &&
      this.getEndOffset() === other.getEndOffset());
  };

  /**
    Checks if this selection has the left boundary in common with another one.

    @param {Selection} other
    @returns {Boolean}
  */
  this.isLeftAlignedWith = function(other) {
    if (other.isNull()) return false;
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.isLeftAlignedWith: delegating to ContainerSelection.isLeftAlignedWith...');
      return other.isLeftAlignedWith(this);
    }
    return (isEqual(this.getPath(), other.getPath()) &&
      this.getStartOffset() === other.getStartOffset());
  };

  /**
    Expands selection to include another selection.

    @param {Selection} other
    @returns {Selection} a new selection
  */
  this.expand = function(other) {
    if (other.isNull()) return this;
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.expand: delegating to ContainerSelection.expand...');
      return other.expand(this);
    }
    if (!isEqual(this.path, other.path)) {
      throw new Error('Can not expand PropertySelection to a different property.');
    }
    var newStartOffset = Math.min(this.startOffset, other.startOffset);
    var newEndOffset = Math.max(this.endOffset, other.endOffset);
    return this.createWithNewRange(newStartOffset, newEndOffset);
  };

  /**
    Creates a new selection with given range and same path.

    @param {Number} startOffset
    @param {Number} endOffset
    @returns {Selection} a new selection
  */
  this.createWithNewRange = function(startOffset, endOffset) {
    return new PropertySelection({
      path: this.path,
      startOffset: startOffset,
      endOffset: endOffset
    });
  };

  /**
    Creates a new selection by truncating this one by another selection.

    @param {Selection} other
    @returns {Selection} a new selection
  */
  this.truncate = function(other) {
    if (other.isNull()) return this;
    // Checking that paths are ok
    // doing that in a generalized manner so that other can even be a ContainerSelection
    if (!isEqual(this.start.path, other.start.path) ||
      !isEqual(this.end.path, other.end.path)) {
      throw new Error('Can not expand PropertySelection to a different property.');
    }
    var newStartOffset;
    var newEndOffset;
    if (this.startOffset === other.startOffset) {
      newStartOffset = other.endOffset;
      newEndOffset = this.endOffset;
    } else if (this.endOffset === other.endOffset) {
      newStartOffset = this.startOffset;
      newEndOffset = other.startOffset;
    }
    return this.createWithNewRange(newStartOffset, newEndOffset);
  };

  this._coordinates = function() {
    return this;
  };

  /**
    Return fragments for a given selection.

    @returns {Selection.Fragment[]}
  */
  this.getFragments = function() {
    if (this.isCollapsed()) {
      return [new Selection.Cursor(this.path, this.startOffset)];
    } else {
      return [new Selection.Fragment(this.path, this.startOffset, this.endOffset)];
    }
  };
};

Selection.extend(PropertySelection);

Object.defineProperties(PropertySelection.prototype, {
  /**
    @property {Coordinate} PropertySelection.start
  */
  start: {
    get: function() {
      return this.range.start;
    },
    set: function() { throw new Error('immutable.'); }
  },
  /**
    @property {Coordinate} PropertySelection.end
  */
  end: {
    get: function() {
      return this.range.end;
    },
    set: function() { throw new Error('immutable.'); }
  },
  /**
    @property {String[]} PropertySelection.path
  */
  path: {
    get: function() {
      return this.range.start.path;
    },
    set: function() { throw new Error('immutable.'); }
  },
  /**
    @property {Number} PropertySelection.startOffset
  */
  startOffset: {
    get: function() {
      return this.range.start.offset;
    },
    set: function() { throw new Error('immutable.'); }
  },
  /**
    @property {Number} PropertySelection.endOffset
  */
  endOffset: {
    get: function() {
      return this.range.end.offset;
    },
    set: function() { throw new Error('immutable.'); }
  },
  /**
    @property {Boolean} PropertySelection.collapsed
  */
  collapsed: {
    get: function() {
      return this.isCollapsed();
    },
    set: function() { throw new Error('immutable.'); }
  },

});

module.exports = PropertySelection;
