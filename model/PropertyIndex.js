import isArray from '../util/isArray'
import TreeIndex from '../util/TreeIndex'
import NodeIndex from './NodeIndex'

export default class PropertyIndex extends NodeIndex {
  constructor (property) {
    super()

    this._property = property || 'id'
    this.index = new TreeIndex()
  }

  /**
    Get all indexed nodes for a given path.

    @param {Array<String>} path
    @returns A node or an object with ids and nodes as values.
   */
  get (path) {
    return this.index.get(path) || {}
  }

  /**
    Collects nodes recursively.

    @returns An object with ids as keys and nodes as values.
   */
  getAll (path) {
    return this.index.getAll(path)
  }

  clear () {
    this.index.clear()
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
  create (node) {
    let values = node.get(this._property)
    if (!isArray(values)) {
      values = [values]
    }
    values.forEach(value => {
      this.index.set([value, node.id], node)
    })
  }

  /**
   * Called when a node has been deleted.
   *
   * Override this in subclasses for customization.
   *
   * @private
   * @param {model/data/Node} node
   */
  delete (node) {
    let values = node.get(this._property)
    if (!isArray(values)) {
      values = [values]
    }
    values.forEach(value => {
      this.index.delete([value, node.id])
    })
  }

  /**
    Called when a property has been updated.

    Override this in subclasses for customization.

    @private
    @param {Node} node
   */
  update (node, path, newValue, oldValue) {
    if (!this.select(node) || path[1] !== this._property) return
    let values = oldValue
    if (!isArray(values)) {
      values = [values]
    }
    values.forEach(value => {
      this.index.delete([value, node.id])
    })
    values = newValue
    if (!isArray(values)) {
      values = [values]
    }
    values.forEach(value => {
      this.index.set([value, node.id], node)
    })
  }

  set (node, path, newValue, oldValue) {
    this.update(node, path, newValue, oldValue)
  }

  _initialize (data) {
    for (let node of data.getNodes().values()) {
      if (this.select(node)) {
        this.create(node)
      }
    }
  }
}
