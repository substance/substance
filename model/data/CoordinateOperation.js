import isNumber from '../../util/isNumber'

const SHIFT = 'shift'

class CoordinateOperation {

  constructor(data) {
    if (!data || data.type === undefined) {
      throw new Error("Illegal argument: insufficient data.")
    }
    // 'shift'
    this.type = data.type
    // the position where to apply the operation
    this.val = data.val
    // sanity checks
    if(!this.isShift()) {
      throw new Error("Illegal type.")
    }
    if (!isNumber(this.val)) {
      throw new Error("Illegal argument: expecting number as shift value.")
    }
  }

  apply(coor) {
    coor.offset = coor.offset + this.val
  }

  isShift() {
    return this.type === SHIFT
  }

  isNOP() {
    switch (this.type) {
      case SHIFT: {
        return this.val === 0
      }
      default:
        return false
    }
  }

  clone() {
    return new CoordinateOperation(this)
  }

  invert() {
    let data
    switch (this.type) {
      case SHIFT:
        data = {
          type: SHIFT,
          val: -this.val
        }
        break
      default:
        throw new Error('Invalid type.')
    }
    return new CoordinateOperation(data)
  }

  hasConflict() {
    // TODO: support conflict detection?
    return false
  }

  toJSON() {
    return {
      type: this.type,
      val: this.val
    }
  }

  toString() {
    return ["(", (this.type), ",", this.val, "')"].join('')
  }

}

CoordinateOperation.prototype._isOperation = true
CoordinateOperation.prototype._isCoordinateOperation = true

function transform_shift_shift(a, b) {
  a.val += b.val
  b.val += a.val
}

function transform(a, b, options) {
  options = options || {}
  // TODO: support conflict detection?
  if (!options.inplace) {
    a = a.clone()
    b = b.clone()
  }
  if (a.type === SHIFT && b.type === SHIFT) {
    transform_shift_shift(a, b)
  }
  else {
    throw new Error('Illegal type')
  }
  return [a, b]
}

CoordinateOperation.transform = function(...args) {
  return transform(...args)
}

CoordinateOperation.fromJSON = function(json) {
  return new CoordinateOperation(json)
}

CoordinateOperation.Shift = function(val) {
  return new CoordinateOperation({
    type: SHIFT,
    val: val
  })
}

export default CoordinateOperation
