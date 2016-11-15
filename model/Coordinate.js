import isArray from '../util/isArray'
import isNumber from '../util/isNumber'
import isArrayEqual from '../util/isArrayEqual'

/**
  @internal
*/
class Coordinate {

  /**
   @param {Array} path the address of a property, such as ['text_1', 'content']
   @param {int} offset the position in the property
   @param {boolean} after an internal flag indicating if the address should be associated to the left or right side

   Note: at boundaries of annotations there are two possible positions with the same address
       foo <strong>bar</strong> ...
     With offset=7 normally we associate this position:
       foo <strong>bar|</strong> ...
     With after=true we can describe this position:
       foo <strong>bar</strong>| ...
  */
  constructor(path, offset, after) {
    // HACK: to allow this class be inherited but without calling this ctor
    if (arguments[0] === 'SKIP') return

    this.path = path
    this.offset = offset
    this.after = after
    if (!isArray(path)) {
      throw new Error('Invalid arguments: path should be an array.')
    }
    if (!isNumber(offset) || offset < 0) {
      throw new Error('Invalid arguments: offset must be a positive number.')
    }
    // make sure that path can't be changed afterwards
    if (!Object.isFrozen(path)) {
      Object.freeze(path)
    }
  }

  equals(other) {
    return (other === this ||
      (isArrayEqual(other.path, this.path) && other.offset === this.offset) )
  }

  withCharPos(offset) {
    return new Coordinate(this.path, offset)
  }

  getNodeId() {
    return this.path[0]
  }

  getPath() {
    return this.path
  }

  getOffset() {
    return this.offset
  }

  toJSON() {
    return {
      path: this.path,
      offset: this.offset,
      after: this.after
    }
  }

  toString() {
    return "(" + this.path.join('.') + ", " + this.offset + ")"
  }

  isPropertyCoordinate() {
    return this.path.length > 1
  }

  isNodeCoordinate() {
    return this.path.length === 1
  }

  hasSamePath(other) {
    return isArrayEqual(this.path, other.path)
  }

}

Coordinate.prototype._isCoordinate = true

export default Coordinate
