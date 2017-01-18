import isArray from '../../util/isArray'
import isNumber from '../../util/isNumber'
import isObject from '../../util/isObject'
import ObjectOperation from './ObjectOperation'
import TextOperation from './TextOperation'
import ArrayOperation from './ArrayOperation'
import CoordinateOperation from './CoordinateOperation'

/*
  Specification:

  - create:
    ```
    'c <JSON.stringify(data)>'
    'c { id: "1123", type: "paragraph", content: ""}'
    ```
  - delete:
    ```
    'd <JSON.stringify(data)>'
    'd { id: "1123", type: "paragraph", content: ""}'
    ```
  - set a property
    ```
    's <property path> <value> <old value>'
    's p1.content foo'
    ```
  - update a property
    ```
    'u <property path> <primitive op>'
    'u p1.content t+ 4 foo'
    ```

Primitive type operations:

  - insert text
    ```
    't+ <pos> <string>'
    't+ 4 foo'
    ```
  - delete text
    ```
    't- <pos> <string>'
    't- 4 foo'
    ```
  - insert value into array
    ```
    'a+ <pos> <value>'
    'a+ 0 p1'
    ```
  - delete value from array
    ```
    'a- <pos> <value>'
    'a- 0 p1'
    ```
*/

class OperationSerializer{

  constructor() {
    this.SEPARATOR = '\t'
  }

  serialize(op) {
    var out = []
    switch (op.type) {
      case 'create':
        out.push('c')
        out.push(op.val.id)
        out.push(op.val)
        break
      case 'delete':
        out.push('d')
        out.push(op.val.id)
        out.push(op.val)
        break
      case 'set':
        out.push('s')
        out.push(op.path.join('.'))
        out.push(op.val)
        out.push(op.original)
        break
      case 'update':
        out.push('u')
        out.push(op.path.join('.'))
        Array.prototype.push.apply(out, this.serializePrimitiveOp(op.diff))
        break
      default:
        throw new Error('Unsupported operation type.')
    }
    return out
  }

  serializePrimitiveOp(op) {
    var out = []
    if (op._isTextOperation) {
      if (op.isInsert()) {
        out.push('t+')
      } else if (op.isDelete()) {
        out.push('t-')
      }
      out.push(op.pos)
      out.push(op.str)
    } else if (op._isArrayOperation) {
      if (op.isInsert()) {
        out.push('a+')
      } else if (op.isDelete()) {
        out.push('a-')
      }
      out.push(op.pos)
      out.push(op.val)
    } else if (op._isCoordinateOperation) {
      if (op.isShift()) {
        out.push('c>>')
      } else {
        throw new Error('Unsupported CoordinateOperation type.')
      }
      out.push(op.pos)
      out.push(op.val)
    } else {
      throw new Error('Unsupported operation type.')
    }
    return out
  }

  deserialize(str, tokenizer) {
    if (!tokenizer) {
      tokenizer = new Tokenizer(str, this.SEPARATOR)
    }
    var type = tokenizer.getString()
    var op, path, val, oldVal, diff
    switch (type) {
      case 'c':
        path = tokenizer.getPath()
        val = tokenizer.getObject()
        op = ObjectOperation.Create(path, val)
        break
      case 'd':
        path = tokenizer.getPath()
        val = tokenizer.getObject()
        op = ObjectOperation.Delete(path, val)
        break
      case 's':
        path = tokenizer.getPath()
        val = tokenizer.getAny()
        oldVal = tokenizer.getAny()
        op = ObjectOperation.Set(path, oldVal, val)
        break
      case 'u':
        path = tokenizer.getPath()
        diff = this.deserializePrimitiveOp(str, tokenizer)
        op = ObjectOperation.Update(path, diff)
        break
      default:
        throw new Error('Illegal type for ObjectOperation: '+ type)
    }
    return op
  }

  deserializePrimitiveOp(str, tokenizer) {
    if (!tokenizer) {
      tokenizer = new Tokenizer(str, this.SEPARATOR)
    }
    var type = tokenizer.getString()
    var op, pos, val
    switch (type) {
      case 't+':
        pos = tokenizer.getNumber()
        val = tokenizer.getString()
        op = TextOperation.Insert(pos, val)
        break
      case 't-':
        pos = tokenizer.getNumber()
        val = tokenizer.getString()
        op = TextOperation.Delete(pos, val)
        break
      case 'a+':
        pos = tokenizer.getNumber()
        val = tokenizer.getAny()
        op = ArrayOperation.Insert(pos, val)
        break
      case 'a-':
        pos = tokenizer.getNumber()
        val = tokenizer.getAny()
        op = ArrayOperation.Delete(pos, val)
        break
      case 'c>>':
        val = tokenizer.getNumber()
        op = CoordinateOperation.Shift(val)
        break
      default:
        throw new Error('Unsupported operation type: ' + type)
    }
    return op
  }
}

class Tokenizer {
  constructor(str, sep) {
    if (isArray(arguments[0])) {
      this.tokens = arguments[0]
    } else {
      this.tokens = str.split(sep)
    }
    this.pos = -1
  }

  error(msg) {
    throw new Error('Parsing error: ' + msg + '\n' + this.tokens[this.pos])
  }

  getString() {
    this.pos++
    var str = this.tokens[this.pos]
    if (str[0] === '"') {
      str = str.slice(1, -1)
    }
    return str
  }

  getNumber() {
    this.pos++
    var number
    var token = this.tokens[this.pos]
    try {
      if (isNumber(token)) {
        number = token
      } else {
        number = parseInt(this.tokens[this.pos], 10)
      }
      return number
    } catch (err) {
      this.error('expected number')
    }
  }

  getObject() {
    this.pos++
    var obj
    var token = this.tokens[this.pos]
    try {
      if (isObject(token)) {
        obj = token
      } else {
        obj = JSON.parse(this.tokens[this.pos])
      }
      return obj
    } catch (err) {
      this.error('expected object')
    }
  }

  getAny() {
    this.pos++
    var token = this.tokens[this.pos]
    return token
  }

  getPath() {
    var str = this.getString()
    return str.split('.')
  }
}

OperationSerializer.Tokenizer = Tokenizer

export default OperationSerializer
