import isString from 'lodash/isString'
import isArray from 'lodash/isArray'
import cloneDeep from 'lodash/cloneDeep'
import Data from './Data'
import ObjectOperation from './ObjectOperation'
import ArrayOperation from './ArrayOperation'
import TextOperation from './TextOperation'

/**
  Incremental data storage implemention.

  @internal
 */
class IncrementalData extends Data {

  /**
    Create a new node.

    @param {object} nodeData
    @returns {ObjectOperation} The applied operation.
   */
  create(nodeData) {
    var op = ObjectOperation.Create([nodeData.id], nodeData)
    this.apply(op)
    return op
  }

  /**
    Delete a node.

    @param {String} nodeId
    @returns {ObjectOperation} The applied operation.
   */
  delete(nodeId) {
    var op = null
    var node = this.get(nodeId)
    if (node) {
      var nodeData = node.toJSON()
      op = ObjectOperation.Delete([nodeId], nodeData)
      this.apply(op)
    }
    return op
  }

  /**
    Update a property incrementally.

    The diff can be of the following forms (depending on the updated property type):
      - String:
        - `{ insert: { offset: Number, value: Object } }`
        - `{ delete: { start: Number, end: Number } }`
      - Array:
        - `{ insert: { offset: Number, value: Object } }`
        - `{ delete: { offset: Number } }`

    @param {array} path
    @param {object} diff
    @returns {ObjectOperation} The applied operation.
  */
  update(path, diff) {
    var diffOp = this._getDiffOp(path, diff)
    var op = ObjectOperation.Update(path, diffOp)
    this.apply(op)
    return op
  }

  /**
    Set a property to a new value

    @param {Array} path
    @param {Object} newValue
    @returns {ObjectOperation} The applied operation.
   */
  set(path, newValue) {
    var oldValue = this.get(path)
    var op = ObjectOperation.Set(path, oldValue, newValue)
    this.apply(op)
    return op
  }

  /**
    Apply a given operation.

    @param {ObjectOperation} op
   */
  apply(op) {
    if (op.type === ObjectOperation.NOP) return
    else if (op.type === ObjectOperation.CREATE) {
      // clone here as the operations value must not be changed
      super.create(cloneDeep(op.val))
    } else if (op.type === ObjectOperation.DELETE) {
      super.delete(op.val.id)
    } else if (op.type === ObjectOperation.UPDATE) {
      var oldVal = this.get(op.path)
      var diff = op.diff
      if (op.propertyType === 'array') {
        if (! (diff._isArrayOperation) ) {
          diff = ArrayOperation.fromJSON(diff)
        }
        // array ops work inplace
        diff.apply(oldVal)
      } else if (op.propertyType === 'string') {
        if (! (diff._isTextOperation) ) {
          diff = TextOperation.fromJSON(diff)
        }
        var newVal = diff.apply(oldVal)
        super.set(op.path, newVal)
      } else {
        throw new Error("Unsupported type for operational update.")
      }
    } else if (op.type === ObjectOperation.SET) {
      super.set(op.path, op.val)
    } else {
      throw new Error("Illegal state.")
    }
    this.emit('operation:applied', op, this)
  }

  /**
    Creates proper operation based on provided node path and diff.

    @param {Array} path
    @param {Object} diff
    @returns {ObjectOperation} operation.
    @private
  */
  _getDiffOp(path, diff) {
    var diffOp = null
    if (diff.isOperation) {
      diffOp = diff
    } else {
      var value = this.get(path)
      var start, end, pos, val
      if (value === null || value === undefined) {
        throw new Error('Property has not been initialized: ' + JSON.stringify(path))
      } else if (isString(value)) {
        if (diff['delete']) {
          // { delete: [2, 5] }
          start = diff['delete'].start
          end = diff['delete'].end
          diffOp = TextOperation.Delete(start, value.substring(start, end))
        } else if (diff['insert']) {
          // { insert: [2, "foo"] }
          pos = diff['insert'].offset
          val = diff['insert'].value
          diffOp = TextOperation.Insert(pos, val)
        }
      } else if (isArray(value)) {
        if (diff['delete']) {
          // { delete: 2 }
          pos = diff['delete'].offset
          diffOp = ArrayOperation.Delete(pos, value[pos])
        } else if (diff['insert']) {
          // { insert: [2, "foo"] }
          pos = diff['insert'].offset
          val = diff['insert'].value
          diffOp = ArrayOperation.Insert(pos, val)
        }
      }
    }
    if (!diffOp) {
      throw new Error('Unsupported diff: ' + JSON.stringify(diff))
    }
    return diffOp
  }

}

export default IncrementalData
