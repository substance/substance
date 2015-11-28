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

  this.toJSON = function() {
    return {
      type: 'property',
      path: this.path,
      startOffset: this.startOffset,
      endOffset: this.endOffset,
      reverse: this.reverse
    };
  };

  this.getDocument = function() {
    var doc = this._internal.doc;
    if (!doc) {
      throw new Error('Selection is not attached to a document.');
    }
    return doc;
  };

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

  this.getPath = function() {
    return this.range.start.path;
  };

  this.getStartOffset = function() {
    return this.range.start.offset;
  };

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

  this.isRightAlignedWith = function(other) {
    if (other.isNull()) return false;
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.isRightAlignedWith: delegating to ContainerSelection.isRightAlignedWith...');
      return other.isRightAlignedWith(this);
    }
    return (isEqual(this.getPath(), other.getPath()) &&
      this.getEndOffset() === other.getEndOffset());
  };

  this.isLeftAlignedWith = function(other) {
    if (other.isNull()) return false;
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.isLeftAlignedWith: delegating to ContainerSelection.isLeftAlignedWith...');
      return other.isLeftAlignedWith(this);
    }
    return (isEqual(this.getPath(), other.getPath()) &&
      this.getStartOffset() === other.getStartOffset());
  };

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

  this.createWithNewRange = function(startOffset, endOffset) {
    return new PropertySelection({
      path: this.path,
      startOffset: startOffset,
      endOffset: endOffset
    });
  };

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
