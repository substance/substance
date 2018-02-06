import isNil from '../util/isNil'
import Coordinate from './Coordinate'
import Selection from './Selection'
import PropertySelection from './PropertySelection'

/**
  A selection spanning multiple nodes.

  @class
  @extends PropertySelection

  @example

  ```js
  let containerSel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  })
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
    this.containerId = containerId
    if (!this.containerId) throw new Error('Invalid arguments: `containerId` is mandatory')

    this.start = new Coordinate(startPath, startOffset)
    this.end = new Coordinate(isNil(endPath) ? startPath : endPath, isNil(endOffset) ? startOffset : endOffset)

    this.reverse = Boolean(reverse)

    this.surfaceId = surfaceId
  }

  /* istanbul ignore start */

  get startPath() {
    console.warn('DEPRECATED: use sel.start.path instead.')
    return this.start.path
  }

  get startOffset() {
    console.warn('DEPRECATED: use sel.start.offset instead.')
    return this.start.offset
  }

  get endPath() {
    console.warn('DEPRECATED: use sel.end.path instead.')
    return this.end.path
  }

  get endOffset() {
    console.warn('DEPRECATED: use sel.end.offset instead.')
    return this.end.offset
  }

  /* istanbul ignore end */

  toJSON() {
    return {
      type: 'container',
      containerId: this.containerId,
      startPath: this.start.path,
      startOffset: this.start.offset,
      endPath: this.end.path,
      endOffset: this.end.offset,
      reverse: this.reverse,
      surfaceId: this.surfaceId
    }
  }

  isContainerSelection() {
    return true
  }

  getType() {
    return 'container'
  }

  isNull() {
    return false
  }

  isCollapsed() {
    return this.start.equals(this.end)
  }

  isReverse() {
    return this.reverse
  }

  equals(other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      this.containerId === other.containerId &&
      (this.start.equals(other.start) && this.end.equals(other.end))
    )
  }

  toString() {
    /* istanbul ignore next */
    return [
      "ContainerSelection(",
      this.containerId, ", ",
      JSON.stringify(this.start.path), ", ", this.start.offset,
      " -> ",
      JSON.stringify(this.end.path), ", ", this.end.offset,
      (this.reverse?", reverse":""),
      (this.surfaceId?(", "+this.surfaceId):""),
      ")"
    ].join('')
  }

  /**
    @return {model/Container} The container node instance for this selection.
  */
  getContainer() {
    if (!this._internal.container) {
      this._internal.container = this.getDocument().get(this.containerId)
    }
    return this._internal.container
  }

  isInsideOf(other, strict) {
    // Note: this gets called from PropertySelection.contains()
    // because this implementation can deal with mixed selection types.
    if (other.isNull()) return false
    strict = Boolean(strict)
    let r1 = this._range(this)
    let r2 = this._range(other)
    return (r2.start.isBefore(r1.start, strict) &&
      r1.end.isBefore(r2.end, strict))
  }

  contains(other, strict) {
    // Note: this gets called from PropertySelection.isInsideOf()
    // because this implementation can deal with mixed selection types.
    if (other.isNull()) return false
    strict = Boolean(strict)
    let r1 = this._range(this)
    let r2 = this._range(other)
    return (r1.start.isBefore(r2.start, strict) &&
      r2.end.isBefore(r1.end, strict))
  }

  containsNode(nodeId, strict) {
    const container = this.getContainer()
    if (!container.contains(nodeId)) return false
    const coor = new Coordinate([nodeId], 0)
    const address = container.getAddress(coor)
    const r = this._range(this)
    // console.log('ContainerSelection.containsNode()', address, 'is within', r.start, '->', r.end, '?')
    let contained = r.start.isBefore(address, strict)
    if (contained) {
      address.offset = 1
      contained = r.end.isAfter(address, strict)
    }
    return contained
  }

  overlaps(other) {
    let r1 = this._range(this)
    let r2 = this._range(other)
    // it overlaps if they are not disjunct
    return !(r1.end.isBefore(r2.start, false) ||
      r2.end.isBefore(r1.start, false))
  }

  isLeftAlignedWith(other) {
    let r1 = this._range(this)
    let r2 = this._range(other)
    return r1.start.isEqual(r2.start)
  }

  isRightAlignedWith(other) {
    let r1 = this._range(this)
    let r2 = this._range(other)
    return r1.end.isEqual(r2.end)
  }

  /**
    Collapse a selection to chosen direction.

    @param {String} direction either left of right
    @returns {PropertySelection}
  */
  collapse(direction) {
    let coor
    if (direction === 'left') {
      coor = this.start
    } else {
      coor = this.end
    }
    return _createNewSelection(this, coor, coor)
  }

  expand(other) {
    let r1 = this._range(this)
    let r2 = this._range(other)
    let start
    let end

    if (r1.start.isEqual(r2.start)) {
      start = new Coordinate(this.start.path, Math.min(this.start.offset, other.start.offset))
    } else if (r1.start.isAfter(r2.start)) {
      start = new Coordinate(other.start.path, other.start.offset)
    } else {
      start = this.start
    }
    if (r1.end.isEqual(r2.end)) {
      end = new Coordinate(this.end.path, Math.max(this.end.offset, other.end.offset))
    } else if (r1.end.isBefore(r2.end, false)) {
      end = new Coordinate(other.end.path, other.end.offset)
    } else {
      end = this.end
    }

    return _createNewSelection(this, start, end)
  }

  truncateWith(other) {
    if (other.isInsideOf(this, 'strict')) {
      // the other selection should overlap only on one side
      throw new Error('Can not truncate with a contained selections')
    }
    if (!this.overlaps(other)) {
      return this
    }
    let r1 = this._range(this)
    let r2 = this._range(other)
    let start, end
    if (r2.start.isBefore(r1.start, 'strict') && r2.end.isBefore(r1.end, 'strict')) {
      start = other.end
      end = this.end
    } else if (r1.start.isBefore(r2.start, 'strict') && r1.end.isBefore(r2.end, 'strict')) {
      start = this.start
      end = other.start
    } else if (r1.start.isEqual(r2.start)) {
      if (r2.end.isBefore(r1.end, 'strict')) {
        start = other.end
        end = this.end
      } else {
        // the other selection is larger which eliminates this one
        return Selection.nullSelection
      }
    } else if (r1.end.isEqual(r2.end)) {
      if (r1.start.isBefore(r2.start, 'strict')) {
        start = this.start
        end = other.start
      } else {
        // the other selection is larger which eliminates this one
        return Selection.nullSelection
      }
    } else if (this.isInsideOf(other)) {
      return Selection.nullSelection
    } else {
      throw new Error('Could not determine coordinates for truncate. Check input')
    }
    return _createNewSelection(this, start, end)
  }

  /**
    Get the node ids covered by this selection.

    @returns {String[]} an array of ids
  */
  getNodeIds() {
    const container = this.getContainer()
    const startPos = container.getPosition(this.start.path[0])
    const endPos = container.getPosition(this.end.path[0])
    return container.getContent().slice(startPos, endPos+1)
  }

  /**
    Splits a container selection into property selections.

    @returns {PropertySelection[]}
  */
  splitIntoPropertySelections() {
    let sels = []
    let fragments = this.getFragments()
    fragments.forEach(function(fragment) {
      if (fragment instanceof Selection.Fragment) {
        sels.push(
          new PropertySelection(fragment.path, fragment.startOffset,
            fragment.endOffset, false, this.containerId, this.surfaceId)
        )
      }
    }.bind(this))
    return sels
  }

  _clone() {
    return new ContainerSelection(this)
  }

  _range(sel) {
    // EXPERIMENTAL: caching the internal address based range
    // as we use it very often.
    // However, this is dangerous as this data can get invalid by a change
    if (sel._internal.addressRange) {
      return sel._internal.addressRange
    }

    let container = this.getContainer()
    let startAddress = container.getAddress(sel.start)
    let endAddress
    if (sel.isCollapsed()) {
      endAddress = startAddress
    } else {
      endAddress = container.getAddress(sel.end)
    }
    let addressRange = {
      start: startAddress,
      end: endAddress
    }
    if (sel._isContainerSelection) {
      sel._internal.addressRange = addressRange
    }
    return addressRange
  }

  get path() {
    throw new Error('ContainerSelection has no path property. Use startPath and endPath instead')
  }

}

ContainerSelection.prototype._isContainerSelection = true

ContainerSelection.fromJSON = function(properties) {
  let sel = new ContainerSelection(properties)
  return sel
}

function _createNewSelection(containerSel, start, end) {
  let newSel

  if (start === end) {
    newSel = new PropertySelection({
      path: start.path,
      startOffset: start.offset,
      endOffset: start.offset,
      containerId: containerSel.containerId,
      surfaceId: containerSel.surfaceId
    })
  } else {
    newSel = new ContainerSelection(containerSel.containerId,
    start.path, start.offset, end.path, end.offset, false, containerSel.surfaceId)
  }
  // we need to attach the new selection
  const doc = containerSel._internal.doc
  if (doc) {
    newSel.attach(doc)
  }
  return newSel
}

export default ContainerSelection
