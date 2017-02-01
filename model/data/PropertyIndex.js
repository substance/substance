import isArray from '../../util/isArray'
import forEach from '../../util/forEach'
import TreeIndex from '../../util/TreeIndex'
import NodeIndex from './NodeIndex'

class PropertyIndex extends NodeIndex {

  constructor(property) {
    super()

    this._property = property || 'id'
    this.index = new TreeIndex()
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
    Check if a node should be indexed.

    Used internally only. Override this in subclasses to achieve a custom behavior.

    @private
    @param {Node}
    @returns {Boolean} true if the given node should be added to the index.
   */
  select(node) { // eslint-disable-line
    return true
  }

  /**
    Called when a node has been created.

    Override this in subclasses for customization.

    @private
    @param {Node} node
   */
  create(node) {
    var values = node[this._property]
    if (!isArray(values)) {
      values = [values]
    }
    forEach(values, function(value) {
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
    var values = node[this._property]
    if (!isArray(values)) {
      values = [values]
    }
    forEach(values, function(value) {
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
    if (!this.select(node) || path[1] !== this._property) return
    var values = oldValue
    if (!isArray(values)) {
      values = [values]
    }
    forEach(values, function(value) {
      this.index.delete([value, node.id])
    }.bind(this))
    values = newValue
    if (!isArray(values)) {
      values = [values]
    }
    forEach(values, function(value) {
      this.index.set([value, node.id], node)
    }.bind(this))
  }

  set(node, path, newValue, oldValue) {
    this.update(node, path, newValue, oldValue)
  }

  _clear() {
    this.index.clear()
  }

  _initialize(data) {
    forEach(data.getNodes(), function(node) {
      if (this.select(node)) {
        this.create(node)
      }
    }.bind(this))
  }
}


export default PropertyIndex