import isEqual from '../../util/isEqual'
import isNil from '../../util/isNil'
import isString from '../../util/isString'
import cloneDeep from '../../util/cloneDeep'
import PathObject from '../../util/PathObject'
import TextOperation from './TextOperation'
import ArrayOperation from './ArrayOperation'
import CoordinateOperation from './CoordinateOperation'
import Conflict from './Conflict'

const NOP = "NOP"
const CREATE = "create"
const DELETE = 'delete'
const UPDATE = 'update'
const SET = 'set'

class ObjectOperation {

  constructor(data) {
    if (!data) {
      throw new Error('Data of ObjectOperation is missing.')
    }
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
    }
    else if (this.type === UPDATE) {
      if (data.diff) {
        this.diff = data.diff
        if (data.diff._isTextOperation) {
          this.propertyType = 'string'
        } else if (data.diff._isArrayOperation) {
          this.propertyType = 'array'
        } else if (data.diff._isCoordinateOperation) {
          this.propertyType = 'coordinate'
        } else {
          throw new Error('Invalid data: diff must be a TextOperation or an ArrayOperation.')
        }
      } else {
        throw new Error("Invalid data: diff is mandatory for update operation.")
      }
    }
    else if (this.type === SET) {
      this.val = data.val
      this.original = data.original
    } else {
      throw new Error('Invalid type: '+ data.type)
    }
  }

  apply(obj) {
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
      adapter.delete(this.path, "strict")
    }
    else if (this.type === UPDATE) {
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
          if (!coor) throw new Error('No coordinate with path '+this.path)
          diff.apply(coor)
          break
        }
        default:
          throw new Error('Invalid state.')
      }
    }
    else if (this.type === SET) {
      // clone here as the operations value must not be changed
      adapter.set(this.path, cloneDeep(this.val))
    }
    else {
      throw new Error('Invalid type.')
    }
    return obj
  }

  clone() {
    var data = {
      type: this.type,
      path: this.path,
    }
    if (this.val) {
      data.val = cloneDeep(this.val)
    }
    if (this.diff) {
      data.diff = this.diff.clone()
    }
    return new ObjectOperation(data)
  }

  isNOP() {
    if (this.type === NOP) return true
    else if (this.type === UPDATE) return this.diff.isNOP()
  }

  isCreate() {
    return this.type === CREATE
  }

  isDelete() {
    return this.type === DELETE
  }

  isUpdate(propertyType) {
    if (propertyType) {
      return (this.type === UPDATE && this.propertyType === propertyType)
    } else {
      return this.type === UPDATE
    }
  }

  isSet() {
    return this.type === SET
  }

  invert() {
    if (this.type === NOP) {
      return new ObjectOperation({ type: NOP })
    }
    var result = new ObjectOperation(this)
    if (this.type === CREATE) {
      result.type = DELETE
    }
    else if (this.type === DELETE) {
      result.type = CREATE
    }
    else if (this.type === UPDATE) {
      var invertedDiff
      if (this.diff._isTextOperation) {
        invertedDiff = TextOperation.fromJSON(this.diff.toJSON()).invert()
      } else if (this.diff._isArrayOperation) {
        invertedDiff = ArrayOperation.fromJSON(this.diff.toJSON()).invert()
      } else if (this.diff._isCoordinateOperation) {
        invertedDiff = CoordinateOperation.fromJSON(this.diff.toJSON()).invert()
      } else {
        throw new Error('Illegal type')
      }
      result.diff = invertedDiff
    }
    else /* if (this.type === SET) */ {
      result.val = this.original
      result.original = this.val
    }
    return result
  }

  hasConflict(other) {
    return ObjectOperation.hasConflict(this, other)
  }

  toJSON() {
    if (this.type === NOP) {
      return { type: NOP }
    }
    var data = {
      type: this.type,
      path: this.path,
    }
    if (this.type === CREATE || this.type === DELETE) {
      data.val = this.val
    }
    else if (this.type === UPDATE) {
      if (this.diff._isTextOperation) {
        data.propertyType = "string"
      } else if (this.diff._isArrayOperation) {
        data.propertyType = "array"
      } else if (this.diff._isCoordinateOperation) {
        data.propertyType = "coordinate"
      } else {
        throw new Error('Invalid property type.')
      }
      data.diff = this.diff.toJSON()
    }
    else /* if (this.type === SET) */ {
      data.val = this.val
      data.original = this.original
    }
    return data
  }

  getType() {
    return this.type
  }

  getPath() {
    return this.path
  }

  getValue() {
    return this.val
  }

  getOldValue() {
    return this.original
  }

  getValueOp() {
    return this.diff
  }

  toString() {
    switch (this.type) {
      case CREATE:
        return ["(+,", JSON.stringify(this.path), JSON.stringify(this.val), ")"].join('')
      case DELETE:
        return ["(-,", JSON.stringify(this.path), JSON.stringify(this.val), ")"].join('')
      case UPDATE:
        return ["(>>,", JSON.stringify(this.path), this.propertyType, this.diff.toString(), ")"].join('')
      case SET:
        return ["(=,", JSON.stringify(this.path), this.val, this.original, ")"].join('')
      case NOP:
        return "NOP"
      default:
        throw new Error('Invalid type')
    }
  }
}

ObjectOperation.prototype._isOperation = true
ObjectOperation.prototype._isObjectOperation = true

/* Low level implementation */

function hasConflict(a, b) {
  if (a.type === NOP || b.type === NOP) return false
  return isEqual(a.path, b.path)
}

function transform_delete_delete(a, b) {
  // both operations have the same effect.
  // the transformed operations are turned into NOPs
  a.type = NOP
  b.type = NOP
}

function transform_create_create() {
  throw new Error("Can not transform two concurring creates of the same property")
}

function transform_delete_create() {
  throw new Error('Illegal state: can not create and delete a value at the same time.')
}

function transform_delete_update(a, b, flipped) {
  if (a.type !== DELETE) {
    return transform_delete_update(b, a, true)
  }
  var op
  switch (b.propertyType) {
    case 'string':
      op = TextOperation.fromJSON(b.diff)
      break
    case 'array':
      op = ArrayOperation.fromJSON(b.diff)
      break
    case 'coordinate':
      op = CoordinateOperation.fromJSON(b.diff)
      break
    default:
      throw new Error('Illegal type')
  }
  // (DELETE, UPDATE) is transformed into (DELETE, CREATE)
  if (!flipped) {
    a.type = NOP
    b.type = CREATE
    b.val = op.apply(a.val)
  }
  // (UPDATE, DELETE): the delete is updated to delete the updated value
  else {
    a.val = op.apply(a.val)
    b.type = NOP
  }
}

function transform_create_update() {
  // it is not possible to reasonably transform this.
  throw new Error("Can not transform a concurring create and update of the same property")
}

function transform_update_update(a, b) {
  // Note: this is a conflict the user should know about
  var op_a, op_b, t
  switch(b.propertyType) {
    case 'string':
      op_a = TextOperation.fromJSON(a.diff)
      op_b = TextOperation.fromJSON(b.diff)
      t = TextOperation.transform(op_a, op_b, {inplace: true})
      break
    case 'array':
      op_a = ArrayOperation.fromJSON(a.diff)
      op_b = ArrayOperation.fromJSON(b.diff)
      t = ArrayOperation.transform(op_a, op_b, {inplace: true})
      break
    case 'coordinate':
      op_a = CoordinateOperation.fromJSON(a.diff)
      op_b = CoordinateOperation.fromJSON(b.diff)
      t = CoordinateOperation.transform(op_a, op_b, {inplace: true})
      break
    default:
      throw new Error('Illegal type')
  }
  a.diff = t[0]
  b.diff = t[1]
}

function transform_create_set() {
  throw new Error('Illegal state: can not create and set a value at the same time.')
}

function transform_delete_set(a, b, flipped) {
  if (a.type !== DELETE) return transform_delete_set(b, a, true)
  if (!flipped) {
    a.type = NOP
    b.type = CREATE
    b.original = undefined
  } else {
    a.val = b.val
    b.type = NOP
  }
}

function transform_update_set() {
  throw new Error("Unresolvable conflict: update + set.")
}

function transform_set_set(a, b) {
  a.type = NOP
  b.original = a.val
}

const _NOP = 0
const _CREATE = 1
const _DELETE = 2
const _UPDATE = 4
const _SET = 8

const CODE = (() => {
  const c = {}
  c[NOP] =_NOP
  c[CREATE] = _CREATE
  c[DELETE] = _DELETE
  c[UPDATE] = _UPDATE
  c[SET] = _SET
  return c
})()

const __transform__ = (() => {
  /* eslint-disable no-multi-spaces */
  const t = {}
  t[_DELETE | _DELETE] = transform_delete_delete
  t[_DELETE | _CREATE] = transform_delete_create
  t[_DELETE | _UPDATE] = transform_delete_update
  t[_CREATE | _CREATE] = transform_create_create
  t[_CREATE | _UPDATE] = transform_create_update
  t[_UPDATE | _UPDATE] = transform_update_update
  t[_CREATE | _SET   ] = transform_create_set
  t[_DELETE | _SET   ] = transform_delete_set
  t[_UPDATE | _SET   ] = transform_update_set
  t[_SET    | _SET   ] = transform_set_set
  /* eslint-enable no-multi-spaces */
  return t
})()

function transform(a, b, options) {
  options = options || {}
  if (options['no-conflict'] && hasConflict(a, b)) {
    throw new Conflict(a, b)
  }
  if (!options.inplace) {
    a = a.clone()
    b = b.clone()
  }
  if (a.isNOP() || b.isNOP()) {
    return [a, b]
  }
  var sameProp = isEqual(a.path, b.path)
  // without conflict: a' = a, b' = b
  if (sameProp) {
    __transform__[CODE[a.type] | CODE[b.type]](a,b)
  }
  return [a, b]
}

ObjectOperation.transform = transform
ObjectOperation.hasConflict = hasConflict

/* Factories */

ObjectOperation.Create = function(idOrPath, val) {
  var path
  if (isString(idOrPath)) {
    path = [idOrPath]
  } else {
    path = idOrPath
  }
  return new ObjectOperation({type: CREATE, path: path, val: val})
}

ObjectOperation.Delete = function(idOrPath, val) {
  var path
  if (isString(idOrPath)) {
    path = [idOrPath]
  } else {
    path = idOrPath
  }
  return new ObjectOperation({type: DELETE, path: path, val: val})
}

ObjectOperation.Update = function(path, op) {
  return new ObjectOperation({
    type: UPDATE,
    path: path,
    diff: op
  })
}

ObjectOperation.Set = function(path, oldVal, newVal) {
  return new ObjectOperation({
    type: SET,
    path: path,
    val: cloneDeep(newVal),
    original: cloneDeep(oldVal)
  })
}

ObjectOperation.fromJSON = function(data) {
  data = cloneDeep(data)
  if (data.type === "update") {
    switch (data.propertyType) {
      case "string":
        data.diff = TextOperation.fromJSON(data.diff)
        break
      case "array":
        data.diff = ArrayOperation.fromJSON(data.diff)
        break
      case "coordinate":
        data.diff = CoordinateOperation.fromJSON(data.diff)
        break
      default:
        throw new Error("Unsupported update diff:" + JSON.stringify(data.diff))
    }
  }
  var op = new ObjectOperation(data)
  return op
}

ObjectOperation.NOP = NOP
ObjectOperation.CREATE = CREATE
ObjectOperation.DELETE = DELETE
ObjectOperation.UPDATE = UPDATE
ObjectOperation.SET = SET

export default ObjectOperation
