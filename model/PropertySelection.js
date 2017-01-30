import isArrayEqual from '../util/isArrayEqual'
import isNumber from '../util/isNumber'
import Selection from './Selection'
import Coordinate from './Coordinate'

/**
  A selection which is bound to a property. Implements {@link model/Selection}.

  @example

  ```js
  var propSel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 6
  })
*/
class PropertySelection extends Selection {

  /**
    @param {array} path
    @param {int} startOffset
    @param {int} endOffset
    @param {bool} reverse
    @param {string} [containerId]
    @param {string} [surfaceId]
  */
  constructor(path, startOffset, endOffset, reverse, containerId, surfaceId) {
    super()

    if (arguments.length === 1) {
      let data = arguments[0]
      path = data.path
      startOffset = data.startOffset
      endOffset = data.endOffset
      reverse = data.reverse
      containerId = data.containerId
      surfaceId = data.surfaceId
    }

    if (!path || !isNumber(startOffset)) {
      throw new Error('Invalid arguments: `path` and `startOffset` are mandatory');
    }

    this.start = new Coordinate(path, startOffset)
    this.end = new Coordinate(path, isNumber(endOffset) ? endOffset : startOffset)

    /**
      Selection direction.
      @type {Boolean}
    */
    this.reverse = Boolean(reverse)

    this.containerId = containerId

    /**
      Identifier of the surface this selection should be active in.
      @type {String}
    */
    this.surfaceId = surfaceId;
  }

  get path() {
    return this.start.path
  }

  get startOffset() {
    console.warn('DEPRECATED: Use sel.start.offset instead')
    return this.start.offset
  }

  get endOffset() {
    console.warn('DEPRECATED: Use sel.end.offset instead')
    return this.end.offset
  }

  /**
    Convert container selection to JSON.

    @returns {Object}
  */
  toJSON() {
    return {
      type: 'property',
      path: this.start.path,
      startOffset: this.start.offset,
      endOffset: this.end.offset,
      reverse: this.reverse,
      containerId: this.containerId,
      surfaceId: this.surfaceId
    }
  }

  isPropertySelection() {
    return true
  }

  getType() {
    return 'property'
  }

  isNull() {
    return false
  }

  isCollapsed() {
    return this.start.offset === this.end.offset;
  }

  isReverse() {
    return this.reverse
  }

  equals(other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      (this.start.equals(other.start) && this.end.equals(other.end))
    )
  }

  toString() {
    /* istanbul ignore next */
    return [
      "PropertySelection(", JSON.stringify(this.path), ", ",
      this.start.offset, " -> ", this.end.offset,
      (this.reverse?", reverse":""),
      (this.surfaceId?(", "+this.surfaceId):""),
      ")"
    ].join('')
  }

  /**
    Collapse a selection to chosen direction.

    @param {String} direction either left of right
    @returns {PropertySelection}
  */
  collapse(direction) {
    var offset
    if (direction === 'left') {
      offset = this.start.offset;
    } else {
      offset = this.end.offset;
    }
    return this.createWithNewRange(offset, offset)
  }

  // Helper Methods
  // ----------------------

  /**
    Get path of a selection, e.g. target property where selected data is stored.

    @returns {String[]} path
  */
  getPath() {
    return this.start.path;
  }

  getNodeId() {
    return this.start.path[0];
  }

  /**
    Checks if this selection is inside another one.

    @param {Selection} other
    @param {Boolean} [strict] true if should check that it is strictly inside the other
    @returns {Boolean}
  */
  isInsideOf(other, strict) {
    if (other.isNull()) return false
    if (other.isContainerSelection()) {
      return other.contains(this, strict)
    }
    if (strict) {
      return (isArrayEqual(this.path, other.path) &&
        this.start.offset > other.start.offset &&
        this.end.offset < other.end.offset);
    } else {
      return (isArrayEqual(this.path, other.path) &&
        this.start.offset >= other.start.offset &&
        this.end.offset <= other.end.offset);
    }
  }

  /**
    Checks if this selection contains another one.

    @param {Selection} other
    @param {Boolean} [strict] true if should check that it is strictly contains the other
    @returns {Boolean}
  */
  contains(other, strict) {
    if (other.isNull()) return false
    return other.isInsideOf(this, strict)
  }

  /**
    Checks if this selection overlaps another one.

    @param {Selection} other
    @param {Boolean} [strict] true if should check that it is strictly overlaps the other
    @returns {Boolean}
  */
  overlaps(other, strict) {
    if (other.isNull()) return false
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.overlaps: delegating to ContainerSelection.overlaps...')
      return other.overlaps(this)
    }
    if (!isArrayEqual(this.path, other.path)) return false
    if (strict) {
      return (! (this.start.offset>=other.end.offset||this.end.offset<=other.start.offset) );
    } else {
      return (! (this.start.offset>other.end.offset||this.end.offset<other.start.offset) );
    }
  }

  /**
    Checks if this selection has the right boundary in common with another one.

    @param {Selection} other
    @returns {Boolean}
  */
  isRightAlignedWith(other) {
    if (other.isNull()) return false
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.isRightAlignedWith: delegating to ContainerSelection.isRightAlignedWith...')
      return other.isRightAlignedWith(this)
    }
    return (isArrayEqual(this.path, other.path) &&
      this.end.offset === other.end.offset);
  }

  /**
    Checks if this selection has the left boundary in common with another one.

    @param {Selection} other
    @returns {Boolean}
  */
  isLeftAlignedWith(other) {
    if (other.isNull()) return false
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.isLeftAlignedWith: delegating to ContainerSelection.isLeftAlignedWith...')
      return other.isLeftAlignedWith(this)
    }
    return (isArrayEqual(this.path, other.path) &&
      this.start.offset === other.start.offset);
  }

  /**
    Expands selection to include another selection.

    @param {Selection} other
    @returns {Selection} a new selection
  */
  expand(other) {
    if (other.isNull()) return this

    // if the other is a ContainerSelection
    // we delegate to that implementation as it is more complex
    // and can deal with PropertySelections, too
    if (other.isContainerSelection()) {
      return other.expand(this)
    }
    if (!isArrayEqual(this.path, other.path)) {
      throw new Error('Can not expand PropertySelection to a different property.')
    }
    var newStartOffset = Math.min(this.start.offset, other.start.offset);
    var newEndOffset = Math.max(this.end.offset, other.end.offset);
    return this.createWithNewRange(newStartOffset, newEndOffset);
  }

  /**
    Creates a new selection by truncating this one by another selection.

    @param {Selection} other
    @returns {Selection} a new selection
  */
  truncateWith(other) {
    if (other.isNull()) return this
    if (other.isInsideOf(this, 'strict')) {
      // the other selection should overlap only on one side
      throw new Error('Can not truncate with a contained selections')
    }
    if (!this.overlaps(other)) {
      return this
    }
    var otherStartOffset, otherEndOffset
    if (other.isPropertySelection()) {
      otherStartOffset = other.start.offset;
      otherEndOffset = other.end.offset;
    } else if (other.isContainerSelection()) {
      // either the startPath or the endPath must be the same
      if (isArrayEqual(other.start.path, this.start.path)) {
        otherStartOffset = other.start.offset;
      } else {
        otherStartOffset = this.start.offset;
      }
      if (isArrayEqual(other.end.path, this.start.path)) {
        otherEndOffset = other.end.offset;
      } else {
        otherEndOffset = this.end.offset;
      }
    } else {
      return this
    }

    var newStartOffset;
    var newEndOffset;
    if (this.start.offset > otherStartOffset && this.end.offset > otherEndOffset) {
      newStartOffset = otherEndOffset;
      newEndOffset = this.end.offset;
    } else if (this.start.offset < otherStartOffset && this.end.offset < otherEndOffset) {
      newStartOffset = this.start.offset;
      newEndOffset = otherStartOffset;
    } else if (this.start.offset === otherStartOffset) {
      if (this.end.offset <= otherEndOffset) {
        return Selection.nullSelection;
      } else {
        newStartOffset = otherEndOffset;
        newEndOffset = this.end.offset;
      }
    } else if (this.end.offset === otherEndOffset) {
      if (this.start.offset >= otherStartOffset) {
        return Selection.nullSelection;
      } else {
        newStartOffset = this.start.offset;
        newEndOffset = otherStartOffset;
      }
    } else if (other.contains(this)) {
      return Selection.nullSelection
    } else {
      // FIXME: if this happens, we have a bug somewhere above
      throw new Error('Illegal state.')
    }
    return this.createWithNewRange(newStartOffset, newEndOffset)
  }

  /**
    Creates a new selection with given range and same path.

    @param {Number} startOffset
    @param {Number} endOffset
    @returns {Selection} a new selection
  */
  createWithNewRange(startOffset, endOffset) {
    var sel = new PropertySelection(this.path, startOffset, endOffset, false, this.containerId, this.surfaceId)
    var doc = this._internal.doc
    if (doc) {
      sel.attach(doc)
    }
    return sel
  }

  /**
    Return fragments for a given selection.

    @returns {Selection.Fragment[]}
  */
  getFragments() {
    if(this._internal.fragments) {
      return this._internal.fragments
    }

    var fragments

    if (this.isCollapsed()) {
      fragments = [new Selection.Cursor(this.path, this.start.offset)];
    } else {
      fragments = [new Selection.Fragment(this.path, this.start.offset, this.end.offset)];
    }

    this._internal.fragments = fragments
    return fragments
  }

  _clone() {
    return new PropertySelection(this.start.path, this.start.offset, this.end.offset, this.reverse, this.containerId, this.surfaceId);
  }

}

PropertySelection.fromJSON = function(json) {
  return new PropertySelection(json)
}

export default PropertySelection
