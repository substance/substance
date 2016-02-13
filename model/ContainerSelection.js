'use strict';

var isNumber = require('lodash/isNumber');
var map = require('lodash/map');
var Selection = require('./Selection');
var PropertySelection = require('./PropertySelection');
var CoordinateAdapter = PropertySelection.CoordinateAdapter;
var RangeAdapter = PropertySelection.RangeAdapter;

/**
  A selection spanning multiple nodes.

  @class
  @extends PropertySelection

  @example

  ```js
  var containerSel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  ```
*/
function ContainerSelection(containerId, startPath, startOffset, endPath, endOffset, reverse, surfaceId) {
  Selection.call(this);

  /**
    @type {String}
  */
  this.containerId = containerId;

  /**
    The path of the property where this annotations starts.
    @type {String[]}
  */
  this.startPath = startPath;

  /**
    The character position where this annotations starts.
    @type {Number}
  */
  this.startOffset = startOffset;

  /**
    The path of the property where this annotations ends.
    @type {String[]}
  */
  this.endPath = endPath;

  /**
    The character position where this annotations ends.
    @type {Number}
  */
  this.endOffset = endOffset;


  this.reverse = !!reverse;

  this.surfaceId = surfaceId;

  if (!this.containerId || !this.startPath || !isNumber(this.startOffset) ||
   !this.endPath || !isNumber(this.endOffset) ) {
    throw new Error('Invalid arguments: `containerId`, `startPath`, `startOffset`, `endPath`, and `endOffset` are mandatory');
  }

  // dynamic adapters for Coordinate oriented implementations
  this._internal.start = new CoordinateAdapter(this, 'startPath', 'startOffset');
  this._internal.end = new CoordinateAdapter(this, 'endPath', 'endOffset');
  this._internal.range = new RangeAdapter(this);
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
      reverse: this.reverse,
      surfaceId: this.surfaceId
    };
  };

  this.isContainerSelection = function() {
    return true;
  };

  this.isNull = function() {
    return false;
  };

  this.isCollapsed = function() {
    return this.start.equals(this.end);
  };

  this.isReverse = function() {
    return this.reverse;
  };

  this.equals = function(other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      this.containerId === other.containerId &&
      (this.start.equals(other.start) && this.end.equals(other.end))
    );
  };

  this.toString = function() {
    return "ContainerSelection("+ JSON.stringify(this.startPath) + ":" + this.startOffset + " -> " +  JSON.stringify(this.endPath) + ":" + this.endOffset + (this.reverse ? ", reverse" : "") + ")";
  };

  /**
    @return {model/Container} The container node instance for this selection.
  */
  this.getContainer = function() {
    return this.getDocument().get(this.containerId);
  };

  /**
    Collapse a selection to chosen direction.

    @param {String} direction either left of right
    @returns {PropertySelection}
  */
  this.collapse = function(direction) {
    var coor;
    if (direction === 'left') {
      coor = this.start;
    } else {
      coor = this.end;
    }
    return this.createWithNewRange(coor, coor);
  };


  this.expand = function(other) {
    var c1 = this._coordinates(this);
    var c2 = this._coordinates(other);
    var c1s = c1.start;
    var c2s = c2.start;
    var c1e = c1.end;
    var c2e = c2.end;
    var start = { address: c1s.address, offset: c1s.offset };
    var end = { address: c1e.address, offset: c1e.offset };

    if (c1s.address.equals(c2s.address)) {
      start.offset = Math.min(c1s.offset, c2s.offset);
    } else if (c1s.address.isAfter(c2s.address)) {
      start.address = c2s.address;
      start.offset = c2s.offset;
    }
    if (c1e.address.equals(c2e.address)) {
      end.offset = Math.max(c1e.offset, c2e.offset);
    } else if (c1e.address.isBefore(c2e.address)) {
      end.address = c2e.address;
      end.offset = c2e.offset;
    }

    return _createNewSelection(this, start, end);
  };

  this.truncate = function(other) {
    var c1 = this._coordinates(this);
    var c2 = this._coordinates(other);

    var start, end;
    if (_isBefore(c2.start, c1.start, 'strict')) {
      start = c1.start;
      end = c2.end;
    } else if (_isBefore(c1.end, c2.end, 'strict')) {
      start = c2.start;
      end = c1.end;
    } else if (_isEqual(c1.start, c2.start)) {
      if (_isEqual(c1.end, c2.end)) {
        return Selection.nullSelection;
      } else {
        start = c2.end;
        end = c1.end;
      }
    } else if (_isEqual(c1.end, c2.end)) {
      start = c1.start;
      end = c2.start;
    } else {
      throw new Error('Could not determine coordinates for truncate. Check input');
    }
    return _createNewSelection(this, start, end);
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

  /**
    Checks if this selection contains another but has at least one boundary in common.

    @private
    @param {Selection} other
    @returns {Boolean}
  */
  this.includesWithOneBoundary = function(other) {
    // includes and at least one boundary
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

  /**
    Splits container selection into property selections

    @returns {PropertySelection[]}
  */
  this.splitIntoPropertySelections = function() {
    var sels = [];
    var container = this.getContainer();
    var paths = container.getPathRange(this.startPath, this.endPath);
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
      sels.push(new PropertySelection(path, startOffset, endOffset, false, this.surfaceId));
    }
    return sels;
  };

  /**
    @returns {Selection.Fragment[]} Fragments resulting from splitting this into property selections.
  */
  this.getFragments = function() {
    // TODO: document what this is exactly used for
    var sels = this.splitIntoPropertySelections();
    var fragments = map(sels, function(sel) {
      return new Selection.Fragment(sel.path,
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
    var startAddress = container.getAddress(sel.startPath);
    var endAddress;
    if (sel.isCollapsed()) {
      endAddress = startAddress;
    } else {
      endAddress = container.getAddress(sel.endPath);
    }
    var containerRange = {
      start: {
        address: startAddress,
        offset: sel.startOffset,
      },
      end: {
        address: endAddress,
        offset: sel.endOffset
      }
    };
    if (sel instanceof ContainerSelection) {
      sel._internal.containerRange = containerRange;
    }
    return containerRange;
  };

  var _isBefore = function(c1, c2, strict) {
    if (c1.address.isBefore(c2.address)) return true;
    if (c1.address.isAfter(c2.address)) return false;
    if (c1.offset > c2.offset) return false;
    if (strict && (c1.offset === c2.offset)) return false;
    return true;
  };

  var _isEqual = function(c1, c2) {
    return (c1.address.equals(c2.address) && c1.offset === c2.offset);
  };

  var _createNewSelection = function(containerSel, start, end) {
    var container = containerSel.getContainer();
    start.path = container.getPathForAddress(start.address);
    end.path = container.getPathForAddress(end.address);
    var newSel = new ContainerSelection(containerSel.containerId,
      start.path, start.offset, end.path, end.offset, false, containerSel.surfaceId);
    // we need to attach the new selection
    var doc = containerSel._internal.doc;
    if (doc) {
      newSel.attach(doc);
    }
    return newSel;
  };
};

Selection.extend(ContainerSelection);

Object.defineProperties(ContainerSelection.prototype, {
  path: {
    get: function() {
      throw new Error('ContainerSelection has no path property. Use startPath and endPath instead');
    },
    set: function() {
      throw new Error('ContainerSelection has no path property. Use startPath and endPath instead.');
    }
  },
  /**
    @property {Coordinate} ContainerSelection.start
  */
  start: {
    get: function() {
      return this._internal.start;
    },
    set: function() { throw new Error('ContainerSelection.prototype.start is read-only.'); }
  },
  /**
    @property {Coordinate} ContainerSelection.end
  */
  end: {
    get: function() {
      return this._internal.end;
    },
    set: function() { throw new Error('ContainerSelection.prototype.end is read-only.'); }
  },

  range: {
    get: function() {
      return this._internal.range;
    },
    set: function() { throw new Error('ContainerSelection.prototype.range is read-only.'); }
  },

});

ContainerSelection.fromJSON = function(properties) {
  // Note: not calling the super ctor as it freezes the instance
  var containerId = properties.containerId;
  var startPath = properties.startPath;
  var endPath = properties.endPath || properties.startPath;
  var startOffset = properties.startOffset;
  var endOffset = properties.endOffset;
  var reverse = !!properties.reverse;
  // Note: to be able to associate selections with surfaces we decided
  // to introduce this optional property
  var surfaceId = properties.surfaceId;
  var sel = new ContainerSelection(containerId, startPath, startOffset, endPath, endOffset, reverse, surfaceId);
  return sel;
};

module.exports = ContainerSelection;
