import isArray from '../util/isArray'
import isString from '../util/isString'
import _isDefined from '../util/_isDefined'
import EventEmitter from '../util/EventEmitter'
import isPlainObject from '../util/isPlainObject'
import cloneDeep from '../util/cloneDeep'

/*
  A data storage implemention that supports data defined via a {@link Schema},
  and incremental updates which are backed by a OT library.

  It forms the underlying implementation for {@link Document}.
 */
export default class Data extends EventEmitter {
  /**
    @param {Schema} schema
    @param {Object} [options]
  */
  constructor (schema, nodeFactory) {
    super()

    /* istanbul ignore start */
    if (!schema) {
      throw new Error('schema is mandatory')
    }
    if (!nodeFactory) {
      throw new Error('nodeFactory is mandatory')
    }
    /* istanbul ignore end */

    this.schema = schema
    this.nodeFactory = nodeFactory
    this.nodes = new Map()
    this.indexes = new Map()

    // Sometimes necessary to resolve issues with updating indexes in presence
    // of cyclic dependencies
    this.__QUEUE_INDEXING__ = false
    this.queue = []
  }

  /**
    Check if this storage contains a node with given id.

    @returns {bool} `true` if a node with id exists, `false` otherwise.
   */
  contains (id) {
    return Boolean(this.nodes.has(id))
  }

  /**
    Get a node or value via path.

    @param {String|String[]} path node id or path to property.
    @returns {Node|Object|Primitive|undefined} a Node instance, a value or undefined if not found.
   */
  get (path, strict) {
    let result = this._get(path)
    if (strict && result === undefined) {
      if (isString(path)) {
        throw new Error("Could not find node with id '" + path + "'.")
      } else if (!this.contains(path[0])) {
        throw new Error("Could not find node with id '" + path[0] + "'.")
      } else {
        throw new Error("Property for path '" + path + "' us undefined.")
      }
    }
    return result
  }

  _get (path) {
    if (!path) return undefined
    let result
    if (isString(path)) {
      let id = path
      result = this.nodes.get(id)
    } else if (path.length === 1) {
      let id = path[0]
      result = this.nodes.get(id)
    } else if (path.length > 1) {
      let id = path[0]
      let node = this.nodes.get(id)
      let val = node.get(path[1])
      for (let i = 2; i < path.length; i++) {
        if (!val) return undefined
        val = val[path[i]]
      }
      result = val
    }
    return result
  }

  /**
    Get the internal storage for nodes.

    @return The internal node storage.
   */
  getNodes () {
    return this.nodes
  }

  /**
    Create a node from the given data.

    @return {Node} The created node.
   */
  create (nodeData) {
    var node = this.nodeFactory.create(nodeData.type, nodeData)
    if (!node) {
      throw new Error('Illegal argument: could not create node for data:', nodeData)
    }
    if (this.contains(node.id)) {
      throw new Error('Node already exists: ' + node.id)
    }
    if (!node.id || !node.type) {
      throw new Error('Node id and type are mandatory.')
    }
    this.nodes.set(node.id, node)

    let change = {
      type: 'create',
      node
    }

    if (this.__QUEUE_INDEXING__) {
      this.queue.push(change)
    } else {
      this._updateIndexes(change)
    }

    return node
  }

  /**
    Delete the node with given id.

    @param {String} nodeId
    @returns {Node} The deleted node.
   */
  delete (nodeId) {
    let node = this.nodes.get(nodeId)
    if (!node) return
    node.dispose()
    this.nodes.delete(nodeId)

    let change = {
      type: 'delete',
      node: node
    }

    if (this.__QUEUE_INDEXING__) {
      this.queue.push(change)
    } else {
      this._updateIndexes(change)
    }

    return node
  }

  /**
    Set a property to a new value.

    @param {Array} property path
    @param {Object} newValue
    @returns {Node} The deleted node.
   */
  set (path, newValue) {
    let node = this.get(path[0])
    let oldValue = this._set(path, newValue)
    var change = {
      type: 'set',
      node: node,
      path: path,
      newValue: newValue,
      oldValue: oldValue
    }
    if (this.__QUEUE_INDEXING__) {
      this.queue.push(change)
    } else {
      this._updateIndexes(change)
    }
    return oldValue
  }

  _set (path, newValue) {
    let oldValue = _setValue(this.nodes, path, newValue)
    return oldValue
  }

  /**
    Update a property incrementally.

    @param {Array} property path
    @param {Object} diff
    @returns {any} The value before applying the update.
  */
  update (path, diff) {
    let node = this.get(path[0])
    let oldValue = this._get(path)
    let newValue
    if (diff._isOperation) {
      // ATTENTION: array operations are done inplace
      if (diff._isArrayOperation) {
        let tmp = oldValue
        oldValue = Array.from(oldValue)
        newValue = diff.apply(tmp)
      // ATTENTION: coordinate operations are done inplace
      } else if (diff._isCoordinateOperation) {
        let tmp = oldValue
        oldValue = oldValue.clone()
        newValue = diff.apply(tmp)
      } else {
        newValue = diff.apply(oldValue)
      }
    } else {
      diff = this._normalizeDiff(oldValue, diff)
      if (isString(oldValue)) {
        switch (diff.type) {
          case 'delete': {
            newValue = oldValue.split('').splice(diff.start, diff.end - diff.start).join('')
            break
          }
          case 'insert': {
            newValue = [oldValue.substring(0, diff.start), diff.text, oldValue.substring(diff.start)].join('')
            break
          }
          default:
            throw new Error('Unknown diff type')
        }
      } else if (isArray(oldValue)) {
        newValue = oldValue.slice(0)
        switch (diff.type) {
          case 'delete': {
            newValue.splice(diff.pos, 1)
            break
          }
          case 'insert': {
            newValue.splice(diff.pos, 0, diff.value)
            break
          }
          default:
            throw new Error('Unknown diff type')
        }
      } else if (oldValue._isCoordinate) {
        switch (diff.type) {
          case 'shift': {
            // ATTENTION: in this case we do not want to create a new value
            oldValue = { path: oldValue.path, offset: oldValue.offset }
            newValue = oldValue
            newValue.offset += diff.value
            break
          }
          default:
            throw new Error('Unknown diff type')
        }
      } else {
        throw new Error('Diff is not supported:', JSON.stringify(diff))
      }
    }
    this._set(path, newValue)

    var change = {
      type: 'update',
      node: node,
      path: path,
      newValue: newValue,
      oldValue: oldValue
    }

    if (this.__QUEUE_INDEXING__) {
      this.queue.push(change)
    } else {
      this._updateIndexes(change)
    }

    return oldValue
  }

  // normalize to support legacy formats
  _normalizeDiff (value, diff) {
    if (isString(value)) {
      // legacy
      if (diff['delete']) {
        console.warn('DEPRECATED: use doc.update(path, {type:"delete", start:s, end: e}) instead')
        diff = {
          type: 'delete',
          start: diff['delete'].start,
          end: diff['delete'].end
        }
      } else if (diff['insert']) {
        console.warn('DEPRECATED: use doc.update(path, {type:"insert", start:s, text: t}) instead')
        diff = {
          type: 'insert',
          start: diff['insert'].offset,
          text: diff['insert'].value
        }
      }
    } else if (isArray(value)) {
      // legacy
      if (diff['delete']) {
        console.warn('DEPRECATED: use doc.update(path, {type:"delete", pos:1}) instead')
        diff = {
          type: 'delete',
          pos: diff['delete'].offset
        }
      } else if (diff['insert']) {
        console.warn('DEPRECATED: use doc.update(path, {type:"insert", pos:1, value: "foo"}) instead')
        diff = {
          type: 'insert',
          pos: diff['insert'].offset,
          value: diff['insert'].value
        }
      }
    } else if (value._isCoordinate) {
      if (_isDefined(diff.shift)) {
        console.warn('DEPRECATED: use doc.update(path, {type:"shift", value:2}) instead')
        diff = {
          type: 'shift',
          value: diff['shift']
        }
      }
    }
    return diff
  }

  /*
    DEPRECATED: We moved away from having JSON as first-class exchange format.
    We will remove this soon.

    @internal
    @deprecated
   */
  toJSON () {
    let nodes = {}
    for (let node of this.nodes.values()) {
      nodes[node.id] = node.toJSON()
    }
    return {
      schema: [this.schema.id, this.schema.version],
      nodes
    }
  }

  reset () {
    this.clear()
  }

  /**
    Clear nodes.

    @internal
   */
  clear () {
    this.nodes = new Map()
    for (let index of this.indexes.values()) {
      index.clear()
    }
  }

  /**
    Add a node index.

    @param {String} name
    @param {NodeIndex} index
   */
  addIndex (name, index) {
    if (this.indexes[name]) {
      console.error('Index with name %s already exists.', name)
    }
    index.reset(this)
    this.indexes.set(name, index)
    return index
  }

  /**
    Get the node index with given name.

    @param {String} name
    @returns {NodeIndex} The node index.
   */
  getIndex (name) {
    return this.indexes.get(name)
  }

  /**
    Update a node index by providing of change object.

    @param {Object} change
   */
  _updateIndexes (change) {
    if (!change || this.__QUEUE_INDEXING__) return
    for (let index of this.indexes.values()) {
      if (index.select(change.node)) {
        switch (change.type) {
          case 'create':
            index.create(change.node)
            break
          case 'delete':
            index.delete(change.node)
            break
          case 'set':
            index.set(change.node, change.path, change.newValue, change.oldValue)
            break
          case 'update':
            index.update(change.node, change.path, change.newValue, change.oldValue)
            break
          default:
            throw new Error('Illegal state.')
        }
      }
    }
  }

  /**
    Stops indexing process, all changes will be collected in indexing queue.

    @private
  */
  _stopIndexing () {
    this.__QUEUE_INDEXING__ = true
  }

  /**
    Update all index changes from indexing queue.

    @private
  */
  _startIndexing () {
    this.__QUEUE_INDEXING__ = false
    while (this.queue.length > 0) {
      var change = this.queue.shift()
      this._updateIndexes(change)
    }
  }
}

function _setValue (nodes, path, newValue) {
  // HACK: cloning the value so that we get independent copies
  if (isArray(newValue)) newValue = newValue.slice()
  else if (isPlainObject(newValue)) newValue = cloneDeep(newValue)

  if (!path || path.length < 2) {
    throw new Error('Illegal value path.')
  }
  const nodeId = path[0]
  const propName = path[1]
  let node = nodes.get(nodeId)
  if (!node) throw new Error(`Unknown node: ${nodeId}`)
  let oldValue = node.get(propName)
  let L = path.length
  if (L > 2) {
    if (!oldValue) throw new Error('Can not set value.')
    let ctx = oldValue
    for (let i = 2; i < L - 1; i++) {
      ctx = ctx[path[i]]
      if (!ctx) throw new Error('Can not set value.')
    }
    let valName = path[path.length - 1]
    oldValue = ctx[valName]
    ctx[valName] = newValue
  } else {
    // ATTENTION: not using node.set() here, because that would
    // again trigger an operation
    node._set(propName, newValue)
  }
  return oldValue
}
