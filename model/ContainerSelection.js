import isArrayEqual from '../util/isArrayEqual'
import isNil from '../util/isNil'
import Coordinate from './Coordinate'
import Selection from './Selection'
import PropertySelection from './PropertySelection'
import compareCoordinates from './_compareCoordinates'
import isCoordinateBefore from './_isCoordinateBefore'

/**
 * A selection spanning multiple nodes.
 *
 *
 * @example
 *
 * ```js
 * let containerSel = doc.createSelection({
 *   type: 'container',
 *   containerPath: 'body',
 *   startPath: ['p1', 'content'],
 *   startOffset: 5,
 *   endPath: ['p3', 'content'],
 *   endOffset: 4,
 * })
 * ```
 */
export default class ContainerSelection extends Selection {
  constructor (containerPath, startPath, startOffset, endPath, endOffset, reverse, surfaceId) {
    super()

    if (arguments.length === 1) {
      let data = arguments[0]
      containerPath = data.containerPath
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
    this.containerPath = containerPath
    if (!this.containerPath) throw new Error('Invalid arguments: `containerPath` is mandatory')

    this.start = new Coordinate(startPath, startOffset)
    this.end = new Coordinate(isNil(endPath) ? startPath : endPath, isNil(endOffset) ? startOffset : endOffset)

    this.reverse = Boolean(reverse)

    this.surfaceId = surfaceId
  }

  /* istanbul ignore start */

  get startPath () {
    console.warn('DEPRECATED: use sel.start.path instead.')
    return this.start.path
  }

  get startOffset () {
    console.warn('DEPRECATED: use sel.start.offset instead.')
    return this.start.offset
  }

  get endPath () {
    console.warn('DEPRECATED: use sel.end.path instead.')
    return this.end.path
  }

  get endOffset () {
    console.warn('DEPRECATED: use sel.end.offset instead.')
    return this.end.offset
  }

  /* istanbul ignore end */

  toJSON () {
    return {
      type: 'container',
      containerPath: this.containerPath,
      startPath: this.start.path,
      startOffset: this.start.offset,
      endPath: this.end.path,
      endOffset: this.end.offset,
      reverse: this.reverse,
      surfaceId: this.surfaceId
    }
  }

  isContainerSelection () {
    return true
  }

  getType () {
    return 'container'
  }

  isNull () {
    return false
  }

  isCollapsed () {
    return this.start.equals(this.end)
  }

  isReverse () {
    return this.reverse
  }

  equals (other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      isArrayEqual(this.containerPath, other.containerPath) &&
      (this.start.equals(other.start) && this.end.equals(other.end))
    )
  }

  toString () {
    /* istanbul ignore next */
    return [
      'ContainerSelection(',
      this.containerPath, ', ',
      JSON.stringify(this.start.path), ', ', this.start.offset,
      ' -> ',
      JSON.stringify(this.end.path), ', ', this.end.offset,
      (this.reverse ? ', reverse' : ''),
      (this.surfaceId ? (', ' + this.surfaceId) : ''),
      ')'
    ].join('')
  }

  isInsideOf (other, strict) {
    // Note: this gets called from PropertySelection.contains()
    // because this implementation can deal with mixed selection types.
    if (other.isNull()) return false
    return (
      this._isCoordinateBefore(other.start, this.start, strict) &&
      this._isCoordinateBefore(this.end, other.end, strict)
    )
  }

  contains (other, strict) {
    // Note: this gets called from PropertySelection.isInsideOf()
    // because this implementation can deal with mixed selection types.
    if (other.isNull()) return false
    return (
      this._isCoordinateBefore(this.start, other.start, strict) &&
      this._isCoordinateBefore(other.end, this.end, strict)
    )
  }

  containsNode (nodeId, strict) {
    let containerPath = this.containerPath
    const nodeIds = this._getContainerContent()
    if (nodeIds.indexOf(nodeId) === -1) return false
    let doc = this.getDocument()
    let nodeCoor = { path: [nodeId], offset: 0 }
    let cmpStart = compareCoordinates(doc, containerPath, nodeCoor, this.start)
    let cmpEnd = compareCoordinates(doc, containerPath, nodeCoor, this.end)
    if (cmpStart < 0 || cmpEnd > 0) return false
    if (strict && (cmpStart === 0 || cmpEnd === 0)) return false
    return true
  }

  overlaps (other) {
    // it overlaps if they are not disjunct
    return (
      !this._isCoordinateBefore(this.end, other.start, false) ||
      this._isCoordinateBefore(other.end, this.start, false)
    )
  }

  isLeftAlignedWith (other) {
    return this.start.isEqual(other.start)
  }

  isRightAlignedWith (other) {
    return this.end.isEqual(other.end)
  }

  /**
   * Collapse a selection to chosen direction.
   *
   * @param {String} direction either left of right
   * @returns {PropertySelection}
   */
  collapse (direction) {
    let coor
    if (direction === 'left') {
      coor = this.start
    } else {
      coor = this.end
    }
    return _createNewSelection(this, coor, coor)
  }

  expand (other) {
    let start
    let end

    if (this.start.isEqual(other.start)) {
      start = new Coordinate(this.start.path, Math.min(this.start.offset, other.start.offset))
    } else if (this._isCoordinateBefore(other.start, this.start, false)) {
      start = new Coordinate(other.start.path, other.start.offset)
    } else {
      start = this.start
    }
    if (this.end.isEqual(other.end)) {
      end = new Coordinate(this.end.path, Math.max(this.end.offset, other.end.offset))
    } else if (this._isCoordinateBefore(this.end, other.end, false)) {
      end = new Coordinate(other.end.path, other.end.offset)
    } else {
      end = this.end
    }

    return _createNewSelection(this, start, end)
  }

  truncateWith (other) {
    if (other.isInsideOf(this, 'strict')) {
      // the other selection should overlap only on one side
      throw new Error('Can not truncate with a contained selections')
    }
    if (!this.overlaps(other)) {
      return this
    }
    let start, end
    if (this._isCoordinateBefore(other.start, this.start, 'strict') && this._isCoordinateBefore(other.end, this.end, 'strict')) {
      start = other.end
      end = this.end
    } else if (this._isCoordinateBefore(this.start, other.start, 'strict') && this._isCoordinateBefore(this.end, other.end, 'strict')) {
      start = this.start
      end = other.start
    } else if (this.start.isEqual(other.start)) {
      if (this._isCoordinateBefore(other.end, this.end, 'strict')) {
        start = other.end
        end = this.end
      } else {
        // the other selection is larger which eliminates this one
        return Selection.nullSelection
      }
    } else if (this.end.isEqual(other.end)) {
      if (this._isCoordinateBefore(this.start, other.start, 'strict')) {
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
   * Get the node ids covered by this selection.
   *
   * @returns {String[]} an getNodeIds of ids
   */
  getNodeIds () {
    // TODO is this still used?
    // TODO: this is not very efficient
    const nodeIds = this._getContainerContent()
    const startPos = nodeIds.indexOf(this.start.path[0])
    const endPos = nodeIds.indexOf(this.end.path[0])
    return nodeIds.slice(startPos, endPos + 1)
  }

  /**
   * Splits a container selection into property selections.
   *
   * @returns {PropertySelection[]}
   */
  splitIntoPropertySelections () {
    let fragments = this.getFragments()
    return fragments.filter(f => f instanceof Selection.Fragment).map(f => {
      return new PropertySelection(f.path, f.startOffset,
        f.endOffset, false, this.containerPath, this.surfaceId)
    })
  }

  /**
   * @return {Array} an array of ids.
   */
  _getContainerContent () {
    return this.getDocument().get(this.containerPath)
  }

  _clone () {
    return new ContainerSelection(this)
  }

  _isCoordinateBefore (coor1, coor2, strict) {
    return isCoordinateBefore(this.getDocument(), this.containerPath, coor1, coor2, strict)
  }

  get path () {
    throw new Error('ContainerSelection has no path property. Use startPath and endPath instead')
  }

  get _isContainerSelection () { return true }

  static fromJSON (properties) {
    let sel = new ContainerSelection(properties)
    return sel
  }
}

function _createNewSelection (containerSel, start, end) {
  let newSel

  if (start === end) {
    newSel = new PropertySelection({
      path: start.path,
      startOffset: start.offset,
      endOffset: start.offset,
      containerPath: containerSel.containerPath,
      surfaceId: containerSel.surfaceId
    })
  } else {
    newSel = new ContainerSelection(
      containerSel.containerPath,
      start.path, start.offset, end.path, end.offset,
      false, containerSel.surfaceId
    )
  }
  // we need to attach the new selection
  const doc = containerSel._internal.doc
  if (doc) {
    newSel.attach(doc)
  }
  return newSel
}
