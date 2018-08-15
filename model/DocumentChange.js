import isPlainObject from '../util/isPlainObject'
import clone from '../util/clone'
import cloneDeep from '../util/cloneDeep'
import forEach from '../util/forEach'
import map from '../util/map'
import uuid from '../util/uuid'
import OperationSerializer from './OperationSerializer'
import ObjectOperation from './ObjectOperation'
import { fromJSON as selectionFromJSON } from './selectionHelpers'

class DocumentChange {
  constructor (ops, before, after) {
    if (arguments.length === 1 && isPlainObject(arguments[0])) {
      let data = arguments[0]
      // a unique id for the change
      this.sha = data.sha
      // when the change has been applied
      this.timestamp = data.timestamp
      // application state before the change was applied
      this.before = data.before || {}
      // array of operations
      this.ops = data.ops
      this.info = data.info // custom change info
      // application state after the change was applied
      this.after = data.after || {}
    } else if (arguments.length === 3) {
      this.sha = uuid()
      this.info = {}
      this.timestamp = Date.now()
      this.ops = ops.slice(0)
      this.before = before || {}
      this.after = after || {}
    } else {
      throw new Error('Illegal arguments.')
    }
    // a hash with all updated properties
    this.updated = null
    // a hash with all created nodes
    this.created = null
    // a hash with all deleted nodes
    this.deleted = null
  }

  /*
    Extract aggregated information about which nodes and properties have been affected.
    This gets called by Document after applying the change.
  */
  _extractInformation (doc) {
    // TODO: we should instead clean-up EditorSession et. al
    // For now we allow this method to be called multiple times, but only extract the details the first time
    if (this._extracted) return

    let ops = this.ops
    let created = {}
    let deleted = {}
    let updated = {}
    let affectedContainerAnnos = []

    // TODO: we will introduce a special operation type for coordinates
    function _checkAnnotation (op) {
      switch (op.type) {
        case 'create':
        case 'delete': {
          let node = op.val
          if (node.hasOwnProperty('start')) {
            updated[node.start.path] = true
          }
          if (node.hasOwnProperty('end')) {
            updated[node.end.path] = true
          }
          break
        }
        case 'update':
        case 'set': {
          // HACK: detecting annotation changes in an opportunistic way
          let node = doc.get(op.path[0])
          if (node) {
            if (node.isPropertyAnnotation()) {
              updated[node.start.path] = true
            } else if (node.isContainerAnnotation()) {
              affectedContainerAnnos.push(node)
            }
          }
          break
        }
        default:
          /* istanbul ignore next */
          // NOP
      }
    }

    for (let i = 0; i < ops.length; i++) {
      let op = ops[i]
      if (op.type === 'create') {
        created[op.val.id] = op.val
        delete deleted[op.val.id]
      }
      if (op.type === 'delete') {
        delete created[op.val.id]
        deleted[op.val.id] = op.val
      }
      if (op.type === 'set' || op.type === 'update') {
        updated[op.path] = true
        // also mark the node itself as dirty
        updated[op.path[0]] = true
      }
      _checkAnnotation(op)
    }

    affectedContainerAnnos.forEach(function (anno) {
      let container = doc.get(anno.containerId, 'strict')
      let startPos = container.getPosition(anno.start.path[0])
      let endPos = container.getPosition(anno.end.path[0])
      for (let pos = startPos; pos <= endPos; pos++) {
        let node = container.getChildAt(pos)
        let path
        if (node.isText()) {
          path = node.getPath()
        } else {
          path = [node.id]
        }
        if (!deleted[node.id]) {
          updated[path] = true
        }
      }
    })

    // remove all deleted nodes from updated
    if (Object.keys(deleted).length > 0) {
      forEach(updated, function (_, key) {
        let nodeId = key.split(',')[0]
        if (deleted[nodeId]) {
          delete updated[key]
        }
      })
    }

    this.created = created
    this.deleted = deleted
    this.updated = updated

    this._extracted = true
  }

  invert () {
    // shallow cloning this
    let copy = this.toJSON()
    copy.ops = []
    // swapping before and after
    let tmp = copy.before
    copy.before = copy.after
    copy.after = tmp
    let inverted = DocumentChange.fromJSON(copy)
    let ops = []
    for (let i = this.ops.length - 1; i >= 0; i--) {
      ops.push(this.ops[i].invert())
    }
    inverted.ops = ops
    return inverted
  }

  /* istanbul ignore start */
  isAffected (path) {
    console.error('DEPRECATED: use change.hasUpdated() instead')
    return this.hasUpdated(path)
  }

  isUpdated (path) {
    console.error('DEPRECATED: use change.hasUpdated() instead')
    return this.hasUpdated(path)
  }
  /* istanbul ignore end */

  hasUpdated (path) {
    return this.updated[path]
  }

  hasDeleted (id) {
    return this.deleted[id]
  }

  serialize () {
    // TODO serializers and deserializers should allow
    // for application data in 'after' and 'before'

    let opSerializer = new OperationSerializer()
    let data = this.toJSON()
    data.ops = this.ops.map(function (op) {
      return opSerializer.serialize(op)
    })
    return JSON.stringify(data)
  }

  clone () {
    return DocumentChange.fromJSON(this.toJSON())
  }

  toJSON () {
    let data = {
      // to identify this change
      sha: this.sha,
      // before state
      before: clone(this.before),
      ops: map(this.ops, function (op) {
        return op.toJSON()
      }),
      info: this.info,
      // after state
      after: clone(this.after)
    }

    // Just to make sure rich selection objects don't end up
    // in the JSON result
    data.after.selection = undefined
    data.before.selection = undefined

    let sel = this.before.selection
    if (sel && sel._isSelection) {
      data.before.selection = sel.toJSON()
    }
    sel = this.after.selection
    if (sel && sel._isSelection) {
      data.after.selection = sel.toJSON()
    }
    return data
  }
}

DocumentChange.deserialize = function (str) {
  let opSerializer = new OperationSerializer()
  let data = JSON.parse(str)
  data.ops = data.ops.map(function (opData) {
    return opSerializer.deserialize(opData)
  })
  if (data.before.selection) {
    data.before.selection = selectionFromJSON(data.before.selection)
  }
  if (data.after.selection) {
    data.after.selection = selectionFromJSON(data.after.selection)
  }
  return new DocumentChange(data)
}

DocumentChange.fromJSON = function (data) {
  // Don't write to original object on deserialization
  let change = cloneDeep(data)
  change.ops = data.ops.map(function (opData) {
    return ObjectOperation.fromJSON(opData)
  })
  change.before.selection = selectionFromJSON(data.before.selection)
  change.after.selection = selectionFromJSON(data.after.selection)
  return new DocumentChange(change)
}

export default DocumentChange
