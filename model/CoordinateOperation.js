import isNumber from '../util/isNumber'

const SHIFT = 'shift'

export default class CoordinateOperation {
  constructor (data) {
    if (!data || data.type === undefined) {
      throw new Error('Illegal argument: insufficient data.')
    }
    // 'shift'
    this.type = data.type
    // the position where to apply the operation
    this.val = data.val
    // sanity checks
    if (!this.isShift()) {
      throw new Error('Illegal type.')
    }
    if (!isNumber(this.val)) {
      throw new Error('Illegal argument: expecting number as shift value.')
    }
  }

  apply (coor) {
    coor.offset = coor.offset + this.val
    return coor
  }

  isShift () {
    return this.type === SHIFT
  }

  isNOP () {
    switch (this.type) {
      case SHIFT: {
        return this.val === 0
      }
      default:
        return false
    }
  }

  clone () {
    return new CoordinateOperation(this)
  }

  invert () {
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

  hasConflict () {
    // TODO: support conflict detection?
    return false
  }

  toJSON () {
    return {
      type: this.type,
      val: this.val
    }
  }

  toString () {
    return ['(', (this.type), ',', this.val, "')"].join('')
  }

  // TODO: do we need this anymore?
  get _isOperation () { return true }

  get _isCoordinateOperation () { return true }

  static transform (a, b, options) {
    return transform(a, b, options)
  }

  static fromJSON (data) {
    return new CoordinateOperation(data)
  }

  static Shift (val) {
    return new CoordinateOperation({
      type: SHIFT,
      val: val
    })
  }

  static get SHIFT () { return SHIFT }
}

function transformShiftShift (a, b, options) {
  if (options.rebase) {
    // FIXME: the idea of having explicit ops for coordinates does not word
    // The actual source of the change is usually a text operation. If that text-operation
    // is changed due to transformation, also should the coordinate shifts.
    // On the other hand, if the text operations remains unchanged, so should be the coordinate shifts
    // Deactivating this a s a quick-fix, to have get a less worse behavior
  } else {
    a.val += b.val
    b.val += a.val
  }
}

function transform (a, b, options = {}) {
  if (a.type === SHIFT && b.type === SHIFT) {
    transformShiftShift(a, b, options)
  } else {
    throw new Error('Illegal type')
  }
  return [a, b]
}
