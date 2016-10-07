import isArray from 'lodash/isArray'
import each from 'lodash/each'
import TreeIndex from '../../util/TreeIndex'

/*
  Index for Nodes.

  Node indexes are first-class citizens in {@link model/data/Data}.
  I.e., they are updated after each operation, and before any other listener is notified.
 */
class NodeIndex {

  constructor() {
    /**
      Internal storage.

      @property {TreeIndex} index
      @private
     */
    this.index = new TreeIndex()

    this._property = "id"
  }

  /**
    Get all indexed nodes for a given path.

    @param {Array<String>} path
    @returns A node or an object with ids and nodes as values.
   */
  get(path) {
    return this.index.get(path) || {}
  }

  /**
    Collects nodes recursively.

    @returns An object with ids as keys and nodes as values.
   */
  getAll(path) {
    return this.index.getAll(path)
  }

  /**
    The property used for indexing.

    @private
    @type {String}
   */
  get property() { return this._property }

  set property(p) { this._property = p }

  /**
    Check if a node should be indexed.

    Used internally only. Override this in subclasses to achieve a custom behavior.

    @private
    @param {Node}
    @returns {Boolean} true if the given node should be added to the index.
   */
  select(node) {
    if(!this.type) {
      return true
    } else {
      return node.isInstanceOf(this.type)
    }
  }

  /**
    Called when a node has been created.

    Override this in subclasses for customization.

    @private
    @param {Node} node
   */
  create(node) {
    var values = node[this.property]
    if (!isArray(values)) {
      values = [values]
    }
    each(values, function(value) {
      this.index.set([value, node.id], node)
    }.bind(this))
  }

  /**
   * Called when a node has been deleted.
   *
   * Override this in subclasses for customization.
   *
   * @private
   * @param {model/data/Node} node
   */
  delete(node) {
    var values = node[this.property]
    if (!isArray(values)) {
      values = [values]
    }
    each(values, function(value) {
      this.index.delete([value, node.id])
    }.bind(this))
  }

  /**
    Called when a property has been updated.

    Override this in subclasses for customization.

    @private
    @param {Node} node
   */
  update(node, path, newValue, oldValue) {
    if (!this.select(node) || path[1] !== this.property) return
    var values = oldValue
    if (!isArray(values)) {
      values = [values]
    }
    each(values, function(value) {
      this.index.delete([value, node.id])
    }.bind(this))
    values = newValue
    if (!isArray(values)) {
      values = [values]
    }
    each(values, function(value) {
      this.index.set([value, node.id], node)
    }.bind(this))
  }

  set(node, path, newValue, oldValue) {
    this.update(node, path, newValue, oldValue)
  }

  /**
    Reset the index using a Data instance.

    @private
   */
  reset(data) {
    this.index.clear()
    this._initialize(data)
  }

  /**
    Clone this index.

    @return A cloned NodeIndex.
   */
  clone() {
    var NodeIndexClass = this.constructor
    var clone = new NodeIndexClass()
    return clone
  }

  _initialize(data) {
    each(data.getNodes(), function(node) {
      if (this.select(node)) {
        this.create(node)
      }
    }.bind(this))
  }

}

/**
  Create a new NodeIndex using the given prototype as mixin.

  @param {Object} prototype
  @returns {NodeIndex} A customized NodeIndex.
 */
NodeIndex.create = function(prototype) {
  var index = Object.assign(new NodeIndex(), prototype)
  index.clone = function() {
    return NodeIndex.create(prototype)
  }
  return index
}

/**
  Create a filter to filter nodes by type.

  @param {String} type
  @returns {function}
 */
NodeIndex.filterByType = function(type) {
  return function(node) {
    return node.isInstanceOf(type)
  }
}

export default NodeIndex
