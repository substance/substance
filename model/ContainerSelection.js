'use strict';

var OO = require('../util/oo');
var _ = require('../util/helpers');
var PropertySelection = require('./PropertySelection');
var Selection = require('./selection');
var Range = require('./range');
var Coordinate = require('./coordinate');

function ContainerSelection(properties) {
  // Note: not calling the super ctor as it freezes the instance
  var containerId = properties.containerId;
  var startPath = properties.startPath;
  var endPath = properties.endPath || properties.startPath;
  var startOffset = properties.startOffset;
  var endOffset = properties.endOffset || properties.startOffset;
  if (!containerId || !startPath || !_.isNumber(startOffset)) {
    throw new Error('Invalid arguments: `containerId`, `startPath` and `startOffset` are mandatory');
  }

  // TODO: validate arguments
  this.containerId = containerId;
  this.range = new Range(
    new Coordinate(startPath, startOffset),
    new Coordinate(endPath, endOffset)
  );
  this.reverse = properties.reverse;
  this._internal = {};
  Object.freeze(this);
}

ContainerSelection.Prototype = function() {

  this.toJSON = function() {
    return {
      type: 'container',
      containerId: this.containerId,
      startPath: this.startPath,
      startOffset: this.startOffset,
      endPath: this.endPath,
      endOffset: this.endOffset,
      reverse: this.reverse
    };
  };

  this.attach = function(doc) {
    this._internal.doc = doc;
    return this;
  };

  this.isPropertySelection = function() {
    return false;
  };

  this.isContainerSelection = function() {
    return true;
  };

  this.toString = function() {
    return "ContainerSelection("+ JSON.stringify(this.range.start.path) + ":" + this.range.start.offset + " -> " +  JSON.stringify(this.range.end.path) + ":" + this.range.end.offset + (this.reverse ? ", reverse" : "") + ")";
  };


  this.getContainer = function() {
    return this.getDocument().get(this.containerId);
  };

  this.expand = function(other) {
    var c1 = this._coordinates(this);
    var c2 = this._coordinates(other);
    var c1s = c1.start;
    var c2s = c2.start;
    var c1e = c1.end;
    var c2e = c2.end;
    var newCoors = {
      start: { address: c1s.address, offset: c1s.offset },
      end: { address: c1e.address, offset: c1e.offset }
    };
    if (c1s.address > c2s.address) {
      newCoors.start.address = c2s.address;
      newCoors.start.offset = c2s.offset;
    } else if (c1s.address < c2s.address) {
      // note leaving this here as '==' is not working on array w/o deep check
    } else /* if (c1s.address == c2s.address) */ {
      newCoors.start.offset = Math.min(c1s.offset, c2s.offset);
    }
    if (c1e.address < c2e.address) {
      newCoors.end.address = c2e.address;
      newCoors.end.offset = c2e.offset;
    } else if (c1e.address > c2e.address) {
      // note leaving this here as '==' is not working on array w/o deep check
    } else /* if (c1e.address === c2e.address) */ {
      newCoors.end.offset = Math.max(c1e.offset, c2e.offset);
    }
    return _createNewSelection(this, newCoors);
  };

  // There should be exactly one
  this.truncate = function(other) {
    var c1 = this._coordinates(this);
    var c2 = this._coordinates(other);

    var newCoors = {};
    if (_isBefore(c2.start, c1.start, 'strict')) {
      newCoors.start = c1.start;
      newCoors.end = c2.end;
    } else if (_isBefore(c1.end, c2.end, 'strict')) {
      newCoors.start = c2.start;
      newCoors.end = c1.end;
    } else if (_isEqual(c1.start, c2.start)) {
      if (_isEqual(c1.end, c2.end)) {
        return Selection.nullSelection;
      } else {
        newCoors.start = c2.end;
        newCoors.end = c1.end;
      }
    } else if (_isEqual(c1.end, c2.end)) {
      newCoors.start = c1.start;
      newCoors.end = c2.start;
    } else {
      throw new Error('Could not determine coordinates for truncate. Check input');
    }
    return _createNewSelection(this, newCoors);
  };

  this.isInsideOf = function(other, strict) {
    if (other.isNull()) return false;
    var c1 = this._coordinates(this);
    var c2 = this._coordinates(other);
    return (_isBefore(c2.start, c1.start, strict) && _isBefore(c1.end, c2.end, strict));
  };

  this.contains = function(other) {
    var c1 = this._coordinates(this);
    var c2 = this._coordinates(other);
    return (_isBefore(c1.start, c2.start) && _isBefore(c2.end, c1.end));
  };

  // includes and at least one boundary
  this.includesWithOneBoundary = function(other) {
    var c1 = this._coordinates(this);
    var c2 = this._coordinates(other);
    return (
      (_isEqual(c1.start, c2.start) && _isBefore(c2.end, c1.end)) ||
      (_isEqual(c1.end, c2.end) && _isBefore(c1.start, c2.start))
    );
  };

  this.overlaps = function(other) {
    var c1 = this._coordinates(this);
    var c2 = this._coordinates(other);
    // it overlaps if they are not disjunct
    return !(_isBefore(c1.end, c2.start) || _isBefore(c2.end, c1.start));
  };

  this.isLeftAlignedWith = function(other) {
    var c1 = this._coordinates(this);
    var c2 = this._coordinates(other);
    return _isEqual(c1.start, c2.start);
  };

  this.isRightAlignedWith = function(other) {
    var c1 = this._coordinates(this);
    var c2 = this._coordinates(other);
    return _isEqual(c1.end, c2.end);
  };

  this.splitIntoPropertySelections = function() {
    var sels = [];
    var container = this.getContainer();
    var range = this.range;
    var paths = container.getPathRange(range.start.path, range.end.path);
    var doc = container.getDocument();
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      var startOffset, endOffset;
      if (i===0) {
        startOffset = this.startOffset;
      } else {
        startOffset = 0;
      }
      if (i === paths.length-1) {
        endOffset = this.endOffset;
      } else {
        endOffset = doc.get(path).length;
      }
      sels.push(doc.createSelection({
        type: 'property',
        path: path,
        startOffset: startOffset,
        endOffset: endOffset
      }));
    }
    return sels;
  };

  this.getFragments = function() {
    var sels = this.splitIntoPropertySelections();
    var fragments = _.map(sels, function(sel) {
      return new Selection.Fragment('selection-fragment', sel.path,
        sel.startOffset, sel.endOffset);
    });
    return fragments;
  };

  this._coordinates = function(sel) {
    // EXPERIMENTAL: caching the internal address based range
    // as we use it very often.
    // However, this bears the danger, that this can get invalid by a change
    if (sel._internal.containerRange) {
      return sel._internal.containerRange;
    }
    var container = this.getContainer();
    var range = sel.getRange();
    var startAddress = container.getAddress(range.start.path);
    var endAddress;
    if (sel.isCollapsed()) {
      endAddress = startAddress;
    } else {
      endAddress = container.getAddress(range.end.path);
    }
    var containerRange = {
      start: {
        address: startAddress,
        offset: range.start.offset,
      },
      end: {
        address: endAddress,
        offset: range.end.offset
      }
    };
    if (sel instanceof ContainerSelection) {
      sel._internal.containerRange = containerRange;
    }
    return containerRange;
  };

  var _isBefore = function(c1, c2, strict) {
    if (c1.address < c2.address) return true;
    if (c1.address > c2.address) return false;
    // now addresses are equal and we need to check offsets
    if (c1.offset > c2.offset) return false;
    if (strict && (c1.offset === c2.offset)) return false;
    return true;
  };

  var _isEqual = function(c1, c2) {
    return (_.isEqual(c1.address, c2.address) && c1.offset === c2.offset);
  };

  var _createNewSelection = function(containerSel, newCoors) {
    var container = containerSel.getContainer();
    newCoors.start.path = container.getPathForAddress(newCoors.start.address);
    newCoors.end.path = container.getPathForAddress(newCoors.end.address);
    var newSel = new ContainerSelection({
      containerId: containerSel.containerId,
      startPath: newCoors.start.path,
      startOffset: newCoors.start.offset,
      endPath: newCoors.end.path,
      endOffset: newCoors.end.offset
    });

    // HACK: We must not loose the document on the way if any is attached.
    var doc = containerSel._internal.doc;
    if (doc) {
      newSel.attach(doc);
    } else {
      console.warn('No document attached to selection');
    }

    return newSel;
  };
};

OO.inherit(ContainerSelection, PropertySelection);

Object.defineProperties(ContainerSelection.prototype, {
  path: {
    get: function() {
      throw new Error('ContainerSelection has no path property. Use startPath and endPath instead');
    },
    set: function() { throw new Error('immutable.'); }
  },
  startPath: {
    get: function() {
      return this.range.start.path;
    },
    set: function() { throw new Error('immutable.'); }
  },
  endPath: {
    get: function() {
      return this.range.end.path;
    },
    set: function() { throw new Error('immutable.'); }
  }
});

module.exports = ContainerSelection;
