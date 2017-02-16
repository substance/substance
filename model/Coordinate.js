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
  */
  constructor(path, offset) {
    // HACK: to allow this class be inherited but without calling this ctor
    if (arguments[0] === 'SKIP') return
    if (arguments.length === 1) {
      let data = arguments[0]
      this.path = data.path
      this.offset = data.offset
    } else {
      this.path = path
      this.offset = offset
    }
    if (!isArray(this.path)) {
      throw new Error('Invalid arguments: path should be an array.')
    }
    if (!isNumber(this.offset) || this.offset < 0) {
      throw new Error('Invalid arguments: offset must be a positive number.')
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
      path: this.path.slice(),
      offset: this.offset
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
