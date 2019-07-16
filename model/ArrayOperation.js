import cloneDeep from '../util/cloneDeep'
import isEqual from '../util/isEqual'
import isNumber from '../util/isNumber'
import Conflict from './Conflict'

const NOP = 'NOP'
const DELETE = 'delete'
const INSERT = 'insert'

export default class ArrayOperation {
  constructor (data) {
    if (!data || !data.type) {
      throw new Error('Illegal argument: insufficient data.')
    }
    this.type = data.type
    if (this.type === NOP) return

    if (this.type !== INSERT && this.type !== DELETE) {
      throw new Error('Illegal type.')
    }
    // the position where to apply the operation
    this.pos = data.pos
    // the value to insert or delete
    this.val = data.val
    if (!isNumber(this.pos) || this.pos < 0) {
      throw new Error('Illegal argument: expecting positive number as pos.')
    }
  }

  apply (array) {
    if (this.type === NOP) {
      return array
    }
    if (this.type === INSERT) {
      if (array.length < this.pos) {
        throw new Error('Provided array is too small.')
      }
      array.splice(this.pos, 0, this.val)
      return array
    // Delete
    } else /* if (this.type === DELETE) */ {
      if (array.length < this.pos) {
        throw new Error('Provided array is too small.')
      }
      if (!isEqual(array[this.pos], this.val)) {
        throw Error('Unexpected value at position ' + this.pos + '. Expected ' + this.val + ', found ' + array[this.pos])
      }
      array.splice(this.pos, 1)
      return array
    }
  }

  clone () {
    var data = {
      type: this.type,
      pos: this.pos,
      val: cloneDeep(this.val)
    }
    return new ArrayOperation(data)
  }

  invert () {
    var data = this.toJSON()
    if (this.type === NOP) data.type = NOP
    else if (this.type === INSERT) data.type = DELETE
    else /* if (this.type === DELETE) */ data.type = INSERT
    return new ArrayOperation(data)
  }

  hasConflict (other) {
    return ArrayOperation.hasConflict(this, other)
  }

  toJSON () {
    var result = {
      type: this.type
    }
    if (this.type === NOP) return result
    result.pos = this.pos
    result.val = cloneDeep(this.val)
    return result
  }

  isInsert () {
    return this.type === INSERT
  }

  isDelete () {
    return this.type === DELETE
  }

  getOffset () {
    return this.pos
  }

  getValue () {
    return this.val
  }

  isNOP () {
    return this.type === NOP
  }

  toString () {
    return ['(', (this.isInsert() ? INSERT : DELETE), ',', this.getOffset(), ",'", this.getValue(), "')"].join('')
  }

  // TODO: find out if we really need this anymore

  get _isOperation () { return true }

  get _isArrayOperation () { return true }

  static transform (a, b, options) {
    return transform(a, b, options)
  }

  static hasConflict (a, b) {
    return hasConflict(a, b)
  }

  // Factories
  static Insert (pos, val) {
    return new ArrayOperation({type: INSERT, pos: pos, val: val})
  }

  static Delete (pos, val) {
    return new ArrayOperation({ type: DELETE, pos: pos, val: val })
  }

  static Nop () {
    return new ArrayOperation({type: NOP})
  }

  static fromJSON (data) {
    return new ArrayOperation(data)
  }

  // Symbols
  static get NOP () { return NOP }

  static get DELETE () { return DELETE }

  static get INSERT () { return INSERT }
}

function hasConflict (a, b) {
  if (a.type === NOP || b.type === NOP) return false
  if (a.type === INSERT && b.type === INSERT) {
    return a.pos === b.pos
  } else {
    return false
  }
}

function transformInsertInsert (a, b) {
  if (a.pos === b.pos) {
    b.pos += 1
  // a before b
  } else if (a.pos < b.pos) {
    b.pos += 1
  // a after b
  } else {
    a.pos += 1
  }
}

function transformDeleteDelete (a, b, options = {}) {
  // turn the second of two concurrent deletes into a NOP
  if (a.pos === b.pos) {
    // ATTENTION: don't update for rebase. If we find a delete on the same
    // index it better be for the same value
    if (a.val !== b.val) {
      console.error('FIXME: transforming array delete-delete at the same position but with different values.')
    }
    if (!options.rebase) {
      b.type = NOP
      a.type = NOP
    }
  } else if (a.pos < b.pos) {
    b.pos -= 1
  } else {
    a.pos -= 1
  }
}

function transformInsertDelete (a, b, options = {}) {
  // reduce to a normalized case
  if (a.type === DELETE) {
    ([a, b] = [b, a])
  }
  // HACK: trying to get rebasing working
  // TODO: we need a different strategy for this
  // the OT approach is not what need in case of 'rebasing' a list of changes
  // e.g. used in for the undo history, but also for merging changes from different sources
  if (options.rebase) {
    if (a.pos < b.pos) {
      b.pos += 1
    } else if (a.pos > b.pos) {
      a.pos -= 1
    }
  } else {
    if (a.pos <= b.pos) {
      b.pos += 1
    } else {
      a.pos -= 1
    }
  }
}

var transform = function (a, b, options = {}) {
  // enable conflicts when you want to notify the user of potential problems
  // Note that even in these cases, there is a defined result.
  if (options['no-conflict'] && hasConflict(a, b)) {
    throw new Conflict(a, b)
  }
  if (a.type === NOP || b.type === NOP) {
    // nothing to transform
  } else if (a.type === INSERT && b.type === INSERT) {
    transformInsertInsert(a, b, options)
  } else if (a.type === DELETE && b.type === DELETE) {
    transformDeleteDelete(a, b, options)
  } else {
    transformInsertDelete(a, b, options)
  }
  return [a, b]
}
