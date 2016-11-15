import isNil from '../util/isNil'
import isNumber from '../util/isNumber'
import Coordinate from './Coordinate'
import Selection from './Selection'
import PropertySelection from './PropertySelection'
import CoordinateAdapter from './CoordinateAdapter'

const RangeAdapter = PropertySelection.RangeAdapter

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
class ContainerSelection extends Selection {

  constructor(containerId, startPath, startOffset, endPath, endOffset, reverse, surfaceId) {
    super()

    if (arguments.length === 1) {
      let data = arguments[0]
      containerId = data.containerId
      startPath = data.startPath
      startOffset = data.startOffset
      endPath = data.endPath
      endOffset = data.endOffset
      reverse = data.reverse
      surfaceId = data.surfaceId
    }

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
    this.endPath = isNil(endPath) ? startPath : endPath;

    /**
      The character position where this annotations ends.
      @type {Number}
    */
    this.endOffset = isNil(endOffset) ? startOffset : endOffset;

    this.reverse = Boolean(reverse);

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

  toJSON() {
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
  }


  isContainerSelection() {
    return true;
  }

  getType() {
    return 'container';
  }

  isNull() {
    return false;
  }

  isCollapsed() {
    return this.start.equals(this.end);
  }

  isReverse() {
    return this.reverse;
  }

  equals(other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      this.containerId === other.containerId &&
      (this.start.equals(other.start) && this.end.equals(other.end))
    );
  }

  toString() {
    /* istanbul ignore next */
    return [
      "ContainerSelection(",
      this.containerId, ", ",
      JSON.stringify(this.startPath), ", ", this.startOffset,
      " -> ",
      JSON.stringify(this.endPath), ", ", this.endOffset,
      (this.reverse?", reverse":""),
      (this.surfaceId?(", "+this.surfaceId):""),
      ")"
    ].join('');
  }

  /**
    @return {model/Container} The container node instance for this selection.
  */
  getContainer() {
    if (!this._internal.container) {
      this._internal.container = this.getDocument().get(this.containerId);
    }
    return this._internal.container;
  }

  isInsideOf(other, strict) {
    // Note: this gets called from PropertySelection.contains()
    // because this implementation can deal with mixed selection types.
    if (other.isNull()) return false;
    strict = Boolean(strict);
    var r1 = this._range(this);
    var r2 = this._range(other);
    return (r2.start.isBefore(r1.start, strict) &&
      r1.end.isBefore(r2.end, strict));
  }

  contains(other, strict) {
    // Note: this gets called from PropertySelection.isInsideOf()
    // because this implementation can deal with mixed selection types.
    if (other.isNull()) return false;
    strict = Boolean(strict);
    var r1 = this._range(this);
    var r2 = this._range(other);
    return (r1.start.isBefore(r2.start, strict) &&
      r2.end.isBefore(r1.end, strict));
  }

  containsNodeFragment(nodeId, strict) {
    var container = this.getContainer();
    var coor = new Coordinate([nodeId], 0);
    var address = container.getAddress(coor);
    var r = this._range(this);
    // console.log('ContainerSelection.containsNodeFragment', address, 'is within', r.start, '->', r.end, '?');
    var contained = r.start.isBefore(address, strict);
    if (contained) {
      address.offset = 1;
      contained = r.end.isAfter(address, strict);
    }
    return contained;
  }

  overlaps(other) {
    var r1 = this._range(this);
    var r2 = this._range(other);
    // it overlaps if they are not disjunct
    return !(r1.end.isBefore(r2.start, false) ||
      r2.end.isBefore(r1.start, false));
  }

  isLeftAlignedWith(other) {
    var r1 = this._range(this);
    var r2 = this._range(other);
    return r1.start.isEqual(r2.start);
  }

  isRightAlignedWith(other) {
    var r1 = this._range(this);
    var r2 = this._range(other);
    return r1.end.isEqual(r2.end);
  }

  containsNode(nodeId) {
    var container = this.getContainer();
    var startPos = container.getPosition(this.startPath[0]);
    var endPos = container.getPosition(this.endPath[0]);
    var pos = container.getPosition(nodeId);
    if ((startPos>pos || endPos<pos) ||
        (startPos === pos && this.startPath.length === 1 && this.startOffset > 0) ||
        (endPos === pos && this.endPath.length === 1 && this.endOffset < 1)) {
      return false;
    }
    return true;
  }

  /**
    Collapse a selection to chosen direction.

    @param {String} direction either left of right
    @returns {PropertySelection}
  */
  collapse(direction) {
    var coor;
    if (direction === 'left') {
      coor = this.start;
    } else {
      coor = this.end;
    }
    return _createNewSelection(this, coor, coor);
  }

  expand(other) {
    var r1 = this._range(this);
    var r2 = this._range(other);
    var start;
    var end;

    if (r1.start.isEqual(r2.start)) {
      start = new Coordinate(this.start.path, Math.min(this.start.offset, other.start.offset));
    } else if (r1.start.isAfter(r2.start)) {
      start = new Coordinate(other.start.path, other.start.offset);
    } else {
      start = this.start;
    }
    if (r1.end.isEqual(r2.end)) {
      end = new Coordinate(this.end.path, Math.max(this.end.offset, other.end.offset));
    } else if (r1.end.isBefore(r2.end, false)) {
      end = new Coordinate(other.end.path, other.end.offset);
    } else {
      end = this.end;
    }

    return _createNewSelection(this, start, end);
  }

  truncateWith(other) {
    if (other.isInsideOf(this, 'strict')) {
      // the other selection should overlap only on one side
      throw new Error('Can not truncate with a contained selections');
    }
    if (!this.overlaps(other)) {
      return this;
    }
    var r1 = this._range(this);
    var r2 = this._range(other);
    var start, end;
    if (r2.start.isBefore(r1.start, 'strict') && r2.end.isBefore(r1.end, 'strict')) {
      start = other.end;
      end = this.end;
    } else if (r1.start.isBefore(r2.start, 'strict') && r1.end.isBefore(r2.end, 'strict')) {
      start = this.start;
      end = other.start;
    } else if (r1.start.isEqual(r2.start)) {
      if (r2.end.isBefore(r1.end, 'strict')) {
        start = other.end;
        end = this.end;
      } else {
        // the other selection is larger which eliminates this one
        return Selection.nullSelection;
      }
    } else if (r1.end.isEqual(r2.end)) {
      if (r1.start.isBefore(r2.start, 'strict')) {
        start = this.start;
        end = other.start;
      } else {
        // the other selection is larger which eliminates this one
        return Selection.nullSelection;
      }
    } else if (this.isInsideOf(other)) {
      return Selection.nullSelection;
    } else {
      throw new Error('Could not determine coordinates for truncate. Check input');
    }
    return _createNewSelection(this, start, end);
  }

  /**
    Helper to create selection fragments for this ContainerSelection.

    Used for selection rendering, for instance.

    @returns {Selection.Fragment[]} Fragments resulting from splitting this into property selections.
  */
  getFragments() {
    if(this._internal.fragments) {
      return this._internal.fragments;
    }

    /*
      NOTE:
        This implementation is a bit more complicated
        to simplify implementations at other places.
        A ContainerSelections can be seen as a list of property and node
        fragments.
        The following implementation is covering all cases in a canonical
        way, considering all combinations of start end end coordinates
        either given as ([nodeId, propertyName], offset) or
        ([nodeId], 0|1).
    */


    var fragments = [];

    var doc = this.getDocument();
    var container = this.getContainer();
    var startPos = container.getPosition(this.startPath[0]);
    var endPos = container.getPosition(this.endPath[0]);

    var coor, node, nodeId, fragment, path, offset, text;
    if (startPos !== endPos) {

      // First fragment can either be a property fragment (fully or partial) or a node fragment
      coor = this.start;
      path = coor.path;
      offset = coor.offset;
      nodeId = path[0];
      node = doc.get(nodeId);
      if (!node) {
        throw new Error('Node does not exist:' + nodeId);
      }
      // coordinate is a property coordinate
      if (coor.isPropertyCoordinate()) {
        text = doc.get(path);
        fragment = new Selection.Fragment(path, offset, text.length, (offset === 0));
        fragments.push(fragment);
      }
      // coordinate is a node coordinate (before)
      else if (coor.isNodeCoordinate() && offset === 0) {
        fragments.push(
          new Selection.NodeFragment(node.id)
        );
      }

      // fragments in-between are either full property fragments or node fragments
      for (var pos= startPos+1; pos < endPos; pos++) {
        node = container.getChildAt(pos);
        if (node.isText()) {
          path = [node.id, 'content'];
          text = doc.get(path);
          fragments.push(
            new Selection.Fragment(path, 0, text.length, true)
          );
        } else {
          fragments.push(
            new Selection.NodeFragment(container.nodes[pos])
          );
        }
      }

      // last fragment is again either a property fragment (fully or partial) or a node fragment
      coor = this.end;
      path = coor.path;
      offset = coor.offset;
      nodeId = path[0];
      node = doc.get(nodeId);
      if (!node) {
        throw new Error('Node does not exist:' + nodeId);
      }
      // coordinate is a property coordinate
      if (coor.isPropertyCoordinate()) {
        text = doc.get(path);
        fragment = new Selection.Fragment(path, 0, offset, (offset === text.length));
        fragments.push(fragment);
      }
      // coordinate is a node coordinate (after)
      else if (coor.isNodeCoordinate() && offset > 0) {
        fragments.push(
          new Selection.NodeFragment(node.id)
        );
      }
    } else {
      // startPos === endPos
      path = this.start.path;
      nodeId = path[0];
      node = doc.get(nodeId);
      var startIsNodeCoordinate = this.start.isNodeCoordinate();
      var endIsNodeCoordinate = this.end.isNodeCoordinate();
      if (!node.isText()) {
        fragments.push(
          new Selection.NodeFragment(nodeId)
        );
      } else if (startIsNodeCoordinate && endIsNodeCoordinate && this.startOffset < this.endOffset) {
        fragments.push(
          new Selection.NodeFragment(nodeId)
        );
      } else if (!startIsNodeCoordinate && endIsNodeCoordinate && this.endOffset > 0) {
        text = doc.get(this.startPath);
        fragments.push(
          new Selection.Fragment(path, this.startOffset, text.length, (this.startOffset === 0))
        );
      } else if (startIsNodeCoordinate && !endIsNodeCoordinate && this.startOffset === 0) {
        text = doc.get(this.endPath);
        fragments.push(
          new Selection.Fragment(path, 0, this.endOffset, (this.endOffset === text.length))
        );
      } else if (!startIsNodeCoordinate && !endIsNodeCoordinate) {
        text = doc.get(this.startPath);
        fragments.push(
          new Selection.Fragment(path, this.startOffset, this.endOffset, (this.startOffset === 0 && this.endOffset === text.length))
        );
      }
    }

    this._internal.fragments = fragments;

    return fragments;
  }

  /**
    Splits a container selection into property selections.

    @returns {PropertySelection[]}
  */
  splitIntoPropertySelections() {
    var sels = [];
    var fragments = this.getFragments();
    fragments.forEach(function(fragment) {
      if (fragment instanceof Selection.Fragment) {
        sels.push(
          new PropertySelection(fragment.path, fragment.startOffset,
            fragment.endOffset, false, this.containerId, this.surfaceId)
        );
      }
    }.bind(this));
    return sels;
  }

  _clone() {
    return new ContainerSelection(this);
  }

  _range(sel) {
    // EXPERIMENTAL: caching the internal address based range
    // as we use it very often.
    // However, this is dangerous as this data can get invalid by a change
    if (sel._internal.addressRange) {
      return sel._internal.addressRange;
    }

    var container = this.getContainer();
    var startAddress = container.getAddress(sel.start);
    var endAddress;
    if (sel.isCollapsed()) {
      endAddress = startAddress;
    } else {
      endAddress = container.getAddress(sel.end);
    }
    var addressRange = {
      start: startAddress,
      end: endAddress
    };
    if (sel._isContainerSelection) {
      sel._internal.addressRange = addressRange;
    }
    return addressRange;
  }
}

ContainerSelection.prototype._isContainerSelection = true

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
  var sel = new ContainerSelection(properties);
  return sel;
}

function _createNewSelection(containerSel, start, end) {
  var newSel = new ContainerSelection(containerSel.containerId,
    start.path, start.offset, end.path, end.offset, false, containerSel.surfaceId);
  // we need to attach the new selection
  var doc = containerSel._internal.doc;
  if (doc) {
    newSel.attach(doc);
  }
  return newSel;
}

export default ContainerSelection

