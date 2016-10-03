import isArray from 'lodash/isArray'
import isString from 'lodash/isString'
import each from 'lodash/each'
import cloneDeep from 'lodash/cloneDeep'
import EventEmitter from '../../util/EventEmitter'
import DataObject from './DataObject'
import NodeFactory from './NodeFactory'

/**
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
    this.nodes = new DataObject()
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
    if (!path) {
      throw new Error('Path or id required')
    }
    var result = this.nodes.get(path)
    if (strict && result === undefined) {
      if (isString(path)) {
        throw new Error("Could not find node with id '"+path+"'.")
      } else {
        throw new Error("Property for path '"+path+"' us undefined.")
      }
    }
    return result
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
    var node = this.get(path[0])
    var oldValue = this.nodes.get(path)
    this.nodes.set(path, newValue)

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

  /**
    Update a property incrementally.

    @param {Array} property path
    @param {Object} diff
    @returns {any} The value before applying the update.
  */
  update(path, diff) {
    // TODO: do we really want this incremental implementation here?
    var oldValue = this.nodes.get(path)
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
          throw new Error('Diff is not supported:', JSON.stringify(diff))
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
          throw new Error('Diff is not supported:', JSON.stringify(diff))
        }
      } else {
        throw new Error('Diff is not supported:', JSON.stringify(diff))
      }
    }
    this.nodes.set(path, newValue)
    var node = this.get(path[0])

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
    each(this.indexes, function(index) {
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
