import cloneDeep from 'lodash/cloneDeep'
import isArray from '../../util/isArray'
import isPlainObject from '../../util/isPlainObject'
import isString from '../../util/isString'
import EventEmitter from '../../util/EventEmitter'
import forEach from '../../util/forEach'
import NodeFactory from './NodeFactory'

/*
  A data storage implemention that supports data defined via a {@link Schema},
  and incremental updates which are backed by a OT library.

  It forms the underlying implementation for {@link Document}.
 */
class Data extends EventEmitter {

  /**
    @param {Schema} schema
    @param {Object} [options]
  */
  constructor(schema, options) {
    super()

    options = options || {}
    this.schema = schema
    this.nodes = {}
    this.indexes = {}
    this.options = options || {}

    this.nodeFactory = options.nodeFactory || new NodeFactory(schema.nodeRegistry)

    // Sometimes necessary to resolve issues with updating indexes in presence
    // of cyclic dependencies
    this.__QUEUE_INDEXING__ = false
    this.queue = []
  }

  /**
    Check if this storage contains a node with given id.

    @returns {bool} `true` if a node with id exists, `false` otherwise.
   */
  contains(id) {
    return Boolean(this.nodes[id])
  }

  /**
    Get a node or value via path.

    @param {String|String[]} path node id or path to property.
    @returns {Node|Object|Primitive|undefined} a Node instance, a value or undefined if not found.
   */
  get(path, strict) {
    let result
    let realPath = this.getRealPath(path)
    if (!realPath) {
      return undefined
    }
    if (isString(realPath)) {
      result = this.nodes[realPath]
    } else if (realPath.length === 1) {
      result = this.nodes[realPath[0]]
    } else {
      result = this.nodes[realPath[0]][realPath[1]]
    }
    if (strict && result === undefined) {
      if (isString(path)) {
        throw new Error("Could not find node with id '"+path+"'.")
      } else {
        throw new Error("Property for path '"+path+"' us undefined.")
      }
    }
    return result
  }

  getRealPath(path) {
    if (!path) return false
    if (isString(path)) return path
    if (path.length < 3) return path
    let realPath = []
    let context = this.nodes[path[0]]
    let prop, name
    let L = path.length
    let i = 1
    for (; i<L-1; i++) {
      if (!context) return false
      name = path[i]
      prop = context[name]
      if (isArray(prop) || isPlainObject(prop)) {
        realPath.push(name)
        context = prop
      } else if (isString(prop)) {
        context = this.nodes[prop]
        realPath = [prop]
      } else {
        return false
      }
    }
    realPath.push(path[i])
    return realPath
  }

  /**
    Get the internal storage for nodes.

    @return The internal node storage.
   */
  getNodes() {
    return this.nodes
  }

  /**
    Create a node from the given data.

    @return {Node} The created node.
   */
  create(nodeData) {
    var node = this.nodeFactory.create(nodeData.type, nodeData)
    if (!node) {
      throw new Error('Illegal argument: could not create node for data:', nodeData)
    }
    if (this.contains(node.id)) {
      throw new Error("Node already exists: " + node.id)
    }
    if (!node.id || !node.type) {
      throw new Error("Node id and type are mandatory.")
    }
    this.nodes[node.id] = node

    var change = {
      type: 'create',
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
    Delete the node with given id.

    @param {String} nodeId
    @returns {Node} The deleted node.
   */
  delete(nodeId) {
    var node = this.nodes[nodeId]
    node.dispose()
    delete this.nodes[nodeId]

    var change = {
      type: 'delete',
      node: node,
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
  set(path, newValue) {
    var realPath = this.getRealPath(path)
    if (!realPath) {
      console.error('Could not resolve path', path)
      return
    }
    var node = this.get(realPath[0])
    var oldValue = node[realPath[1]]
    node[realPath[1]] = newValue

    var change = {
      type: 'set',
      node: node,
      path: realPath,
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

  /**
    Update a property incrementally.

    @param {Array} property path
    @param {Object} diff
    @returns {any} The value before applying the update.
  */
  update(path, diff) {
    // TODO: do we really want this incremental implementation here?
    var realPath = this.getRealPath(path)
    if (!realPath) {
      console.error('Could not resolve path', path)
      return
    }
    var node = this.get(realPath[0])
    var oldValue = this.get(realPath)
    var newValue
    if (diff.isOperation) {
      newValue = diff.apply(oldValue)
    } else {
      var start, end, pos, val
      if (isString(oldValue)) {
        if (diff['delete']) {
          // { delete: [2, 5] }
          start = diff['delete'].start
          end = diff['delete'].end
          newValue = oldValue.split('').splice(start, end-start).join('')
        } else if (diff['insert']) {
          // { insert: [2, "foo"] }
          pos = diff['insert'].offset
          val = diff['insert'].value
          newValue = [oldValue.substring(0, pos), val, oldValue.substring(pos)].join('')
        } else {
          throw new Error('Diff is not supported:' + JSON.stringify(diff))
        }
      } else if (isArray(oldValue)) {
        newValue = oldValue.slice(0)
        if (diff['delete']) {
          // { delete: 2 }
          pos = diff['delete'].offset
          newValue.splice(pos, 1)
        } else if (diff['insert']) {
          // { insert: [2, "foo"] }
          pos = diff['insert'].offset
          val = diff['insert'].value
          newValue.splice(pos, 0, val)
        } else {
          throw new Error('Diff is not supported:' + JSON.stringify(diff))
        }
      } else if (oldValue._isCoordinate) {
        if (diff['shift']) {
          val = diff['shift']
        } else {
          throw new Error('Diff is not supported:' + JSON.stringify(diff))
        }
      } else {
        throw new Error('Diff is not supported:', JSON.stringify(diff))
      }
    }
    this.nodes.set(realPath, newValue)

    var change = {
      type: 'update',
      node: node,
      path: realPath,
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

  /*
    DEPRECATED: We moved away from having JSON as first-class exchange format.
    We will remove this soon.

    @internal
    @deprecated
   */
  toJSON() {
    return {
      schema: [this.schema.id, this.schema.version],
      nodes: cloneDeep(this.nodes)
    }
  }

  /**
    Clear nodes.

    @internal
   */
  reset() {
    this.nodes.clear()
  }

  /**
    Add a node index.

    @param {String} name
    @param {NodeIndex} index
   */
  addIndex(name, index) {
    if (this.indexes[name]) {
      console.error('Index with name %s already exists.', name)
    }
    index.reset(this)
    this.indexes[name] = index
    return index
  }

  /**
    Get the node index with given name.

    @param {String} name
    @returns {NodeIndex} The node index.
   */
  getIndex(name) {
    return this.indexes[name]
  }

  /**
    Update a node index by providing of change object.

    @param {Object} change
   */
  _updateIndexes(change) {
    if (!change || this.__QUEUE_INDEXING__) return
    forEach(this.indexes, function(index) {
      if (index.select(change.node)) {
        if (!index[change.type]) {
          console.error('Contract: every NodeIndex must implement ' + change.type)
        }
        index[change.type](change.node, change.path, change.newValue, change.oldValue)
      }
    })
  }

  /**
    Stops indexing process, all changes will be collected in indexing queue.

    @private
  */
  _stopIndexing() {
    this.__QUEUE_INDEXING__ = true
  }

  /**
    Update all index changes from indexing queue.

    @private
  */
  _startIndexing() {
    this.__QUEUE_INDEXING__ = false
    while(this.queue.length >0) {
      var change = this.queue.shift()
      this._updateIndexes(change)
    }
  }

}

export default Data
