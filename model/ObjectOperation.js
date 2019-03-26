import isEqual from '../util/isEqual'
import isNil from '../util/isNil'
import isString from '../util/isString'
import cloneDeep from '../util/cloneDeep'
import PathObject from '../util/PathObject'
import TextOperation from './TextOperation'
import ArrayOperation from './ArrayOperation'
import CoordinateOperation from './CoordinateOperation'
import Conflict from './Conflict'

const NOP = 'NOP'
const CREATE = 'create'
const DELETE = 'delete'
const UPDATE = 'update'
const SET = 'set'

export default class ObjectOperation {
  constructor (data) {
    /* istanbul ignore next */
    if (!data) {
      throw new Error('Data of ObjectOperation is missing.')
    }
    /* istanbul ignore next */
    if (!data.type) {
      throw new Error('Invalid data: type is mandatory.')
    }
    this.type = data.type
    if (data.type === NOP) {
      return
    }
    this.path = data.path
    if (!data.path) {
      throw new Error('Invalid data: path is mandatory.')
    }
    if (this.type === CREATE || this.type === DELETE) {
      if (!data.val) {
        throw new Error('Invalid data: value is missing.')
      }
      this.val = data.val
    } else if (this.type === UPDATE) {
      if (data.diff) {
        this.diff = data.diff
        if (data.diff._isTextOperation) {
          this.propertyType = 'string'
        } else if (data.diff._isArrayOperation) {
          this.propertyType = 'array'
        } else if (data.diff._isCoordinateOperation) {
          this.propertyType = 'coordinate'
        } else {
          throw new Error('Invalid data: unsupported operation type for incremental update.')
        }
      } else {
        throw new Error('Invalid data: diff is mandatory for update operation.')
      }
    } else if (this.type === SET) {
      this.val = data.val
      this.original = data.original
    } else {
      throw new Error('Invalid type: ' + data.type)
    }
  }

  apply (obj) {
    if (this.type === NOP) return obj
    var adapter
    if (obj._isPathObject) {
      adapter = obj
    } else {
      adapter = new PathObject(obj)
    }
    if (this.type === CREATE) {
      adapter.set(this.path, cloneDeep(this.val))
      return obj
    }
    if (this.type === DELETE) {
      adapter.delete(this.path, 'strict')
    } else if (this.type === UPDATE) {
      var diff = this.diff
      switch (this.propertyType) {
        case 'array': {
          let arr = adapter.get(this.path)
          diff.apply(arr)
          break
        }
        case 'string': {
          let str = adapter.get(this.path)
          if (isNil(str)) str = ''
          str = diff.apply(str)
          adapter.set(this.path, str)
          break
        }
        case 'coordinate': {
          let coor = adapter.get(this.path)
          if (!coor) throw new Error('No coordinate with path ' + this.path)
          diff.apply(coor)
          break
        }
        default:
          throw new Error('Unsupported property type for incremental update: ' + this.propertyType)
      }
    } else if (this.type === SET) {
      // clone here as the operations value must not be changed
      adapter.set(this.path, cloneDeep(this.val))
    } else {
      throw new Error('Invalid type.')
    }
    return obj
  }

  clone () {
    var data = {
      type: this.type,
      path: this.path
    }
    if (this.val) {
      data.val = cloneDeep(this.val)
    }
    if (this.diff) {
      data.diff = this.diff.clone()
    }
    return new ObjectOperation(data)
  }

  isNOP () {
    if (this.type === NOP) return true
    else if (this.type === UPDATE) return this.diff.isNOP()
  }

  isCreate () {
    return this.type === CREATE
  }

  isDelete () {
    return this.type === DELETE
  }

  isUpdate (propertyType) {
    if (propertyType) {
      return (this.type === UPDATE && this.propertyType === propertyType)
    } else {
      return this.type === UPDATE
    }
  }

  isSet () {
    return this.type === SET
  }

  invert () {
    if (this.type === NOP) {
      return new ObjectOperation({ type: NOP })
    }
    var result = new ObjectOperation(this)
    if (this.type === CREATE) {
      result.type = DELETE
    } else if (this.type === DELETE) {
      result.type = CREATE
    } else if (this.type === UPDATE) {
      result.diff = this.diff.clone().invert()
    } else /* if (this.type === SET) */ {
      result.val = this.original
      result.original = this.val
    }
    return result
  }

  hasConflict (other) {
    return ObjectOperation.hasConflict(this, other)
  }

  toJSON () {
    if (this.type === NOP) {
      return { type: NOP }
    }
    var data = {
      type: this.type,
      path: this.path
    }
    if (this.type === CREATE || this.type === DELETE) {
      data.val = this.val
    } else if (this.type === UPDATE) {
      if (this.diff._isTextOperation) {
        data.propertyType = 'string'
      } else if (this.diff._isArrayOperation) {
        data.propertyType = 'array'
      } else if (this.diff._isCoordinateOperation) {
        data.propertyType = 'coordinate'
      } else {
        throw new Error('Invalid property type.')
      }
      data.diff = this.diff.toJSON()
    } else /* if (this.type === SET) */ {
      data.val = this.val
      data.original = this.original
    }
    return data
  }

  getType () {
    return this.type
  }

  getPath () {
    return this.path
  }

  getValue () {
    return this.val
  }

  getOldValue () {
    return this.original
  }

  getValueOp () {
    return this.diff
  }

  /* istanbul ignore next */
  toString () {
    switch (this.type) {
      case CREATE:
        return ['(+,', JSON.stringify(this.path), JSON.stringify(this.val), ')'].join('')
      case DELETE:
        return ['(-,', JSON.stringify(this.path), JSON.stringify(this.val), ')'].join('')
      case UPDATE:
        return ['(>>,', JSON.stringify(this.path), this.propertyType, this.diff.toString(), ')'].join('')
      case SET:
        return ['(=,', JSON.stringify(this.path), this.val, this.original, ')'].join('')
      case NOP:
        return 'NOP'
      default:
        throw new Error('Invalid type')
    }
  }

  static transform (a, b, options) {
    return transform(a, b, options)
  }

  static hasConflict (a, b) {
    return hasConflict(a, b)
  }

  // Factories

  static Create (idOrPath, val) {
    var path
    if (isString(idOrPath)) {
      path = [idOrPath]
    } else {
      path = idOrPath
    }
    return new ObjectOperation({type: CREATE, path: path, val: val})
  }

  static Delete (idOrPath, val) {
    var path
    if (isString(idOrPath)) {
      path = [idOrPath]
    } else {
      path = idOrPath
    }
    return new ObjectOperation({type: DELETE, path: path, val: val})
  }

  static Update (path, op) {
    return new ObjectOperation({
      type: UPDATE,
      path: path,
      diff: op
    })
  }

  static Set (path, oldVal, newVal) {
    return new ObjectOperation({
      type: SET,
      path: path,
      val: cloneDeep(newVal),
      original: cloneDeep(oldVal)
    })
  }

  static fromJSON (data) {
    data = cloneDeep(data)
    if (data.type === 'update') {
      data.diff = _deserializeDiffOp(data.propertyType, data.diff)
    }
    let op = new ObjectOperation(data)
    return op
  }

  // Symbols
  // TODO: we should probably just export these symbols
  static get NOP () { return NOP }
  static get CREATE () { return CREATE }
  static get DELETE () { return DELETE }
  static get UPDATE () { return UPDATE }
  static get SET () { return SET }

  // TODO: do we need this anymore?
  get _isOperation () { return true }
  get _isObjectOperation () { return true }
}

/* Low level implementation */

function hasConflict (a, b) {
  if (a.type === NOP || b.type === NOP) return false
  return isEqual(a.path, b.path)
}

function transformDeleteDelete (a, b, options = {}) {
  // no destructive transformation for rebase
  if (!options.rebase) {
    // both operations have the same effect.
    // the transformed operations are turned into NOPs
    a.type = NOP
    b.type = NOP
  }
}

function transformCreateCreate (a, b, options = {}) {
  if (!options.rebase) {
    throw new Error('Can not transform two concurring creates of the same property')
  }
}

function transformDeleteCreate (a, b, options = {}) {
  if (!options.rebase) {
    throw new Error('Illegal state: can not create and delete a value at the same time.')
  }
}

function _transformDeleteUpdate (a, b, flipped, options = {}) {
  // no destructive transformation for rebase
  if (!options.rebase) {
    if (a.type !== DELETE) {
      return _transformDeleteUpdate(b, a, true, options)
    }
    let op = _deserializeDiffOp(b.propertyType, b.diff)
    // (DELETE, UPDATE) is transformed into (DELETE, CREATE)
    if (!flipped) {
      a.type = NOP
      b.type = CREATE
      b.val = op.apply(a.val)
    // (UPDATE, DELETE): the delete is updated to delete the updated value
    } else {
      a.val = op.apply(a.val)
      b.type = NOP
    }
  }
}

function transformDeleteUpdate (a, b, options = {}) {
  return _transformDeleteUpdate(a, b, false, options)
}

function transformCreateUpdate () {
  // it is not possible to reasonably transform this.
  throw new Error('Can not transform a concurring create and update of the same property')
}

function transformUpdateUpdate (a, b, options = {}) {
  // Note: this is a conflict the user should know about
  let opA = _deserializeDiffOp(a.propertyType, a.diff)
  let opB = _deserializeDiffOp(b.propertyType, b.diff)
  let t
  switch (b.propertyType) {
    case 'string':
      t = TextOperation.transform(opA, opB, options)
      break
    case 'array':
      t = ArrayOperation.transform(opA, opB, options)
      break
    case 'coordinate':
      t = CoordinateOperation.transform(opA, opB, options)
      break
    default:
      throw new Error('Unsupported property type for incremental update')
  }
  a.diff = t[0]
  b.diff = t[1]
}

function _deserializeDiffOp (propertyType, diff) {
  if (diff._isOperation) return diff
  switch (propertyType) {
    case 'string':
      return TextOperation.fromJSON(diff)
    case 'array':
      return ArrayOperation.fromJSON(diff)
    case 'coordinate':
      return CoordinateOperation.fromJSON(diff)
    default:
      throw new Error('Unsupported property type for incremental update.')
  }
}

function transformCreateSet (a, b, options = {}) {
  if (!options.rebase) {
    throw new Error('Illegal state: can not create and set a value at the same time.')
  }
}

function _transformDeleteSet (a, b, flipped, options = {}) {
  if (a.type !== DELETE) return _transformDeleteSet(b, a, true, options)
  // no destructive transformation for rebase
  if (!options.rebase) {
    if (!flipped) {
      a.type = NOP
      b.type = CREATE
      b.original = undefined
    } else {
      a.val = b.val
      b.type = NOP
    }
  }
}

function transformDeleteSet (a, b, options = {}) {
  return _transformDeleteSet(a, b, false, options)
}

function transformUpdateSet (a, b, options = {}) {
  if (!options.rebase) {
    throw new Error('Unresolvable conflict: update + set.')
  }
}

function transformSetSet (a, b, options = {}) {
  // no destructive transformation for rebase
  if (!options.rebase) {
    a.type = NOP
    b.original = a.val
  }
}

const _NOP = 0
const _CREATE = 1
const _DELETE = 2
const _UPDATE = 4
const _SET = 8

const CODE = (() => {
  const c = {}
  c[NOP] = _NOP
  c[CREATE] = _CREATE
  c[DELETE] = _DELETE
  c[UPDATE] = _UPDATE
  c[SET] = _SET
  return c
})()

const __transform__ = (() => {
  /* eslint-disable no-multi-spaces */
  const t = {}
  t[_DELETE | _DELETE] = transformDeleteDelete
  t[_DELETE | _CREATE] = transformDeleteCreate
  t[_DELETE | _UPDATE] = transformDeleteUpdate
  t[_CREATE | _CREATE] = transformCreateCreate
  t[_CREATE | _UPDATE] = transformCreateUpdate
  t[_UPDATE | _UPDATE] = transformUpdateUpdate
  t[_CREATE | _SET] = transformCreateSet
  t[_DELETE | _SET] = transformDeleteSet
  t[_UPDATE | _SET] = transformUpdateSet
  t[_SET    | _SET] = transformSetSet
  /* eslint-enable no-multi-spaces */
  return t
})()

function transform (a, b, options = {}) {
  if (options['no-conflict'] && hasConflict(a, b)) {
    throw new Conflict(a, b)
  }
  if (a.isNOP() || b.isNOP()) {
    return [a, b]
  }
  var sameProp = isEqual(a.path, b.path)
  // without conflict: a' = a, b' = b
  if (sameProp) {
    __transform__[CODE[a.type] | CODE[b.type]](a, b, options)
  }
  return [a, b]
}
