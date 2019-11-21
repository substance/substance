export default class NodeIndex {
  /*
    Check if a node should be indexed.

    Override this in subclasses to achieve a custom behavior.

    @param {Node}
    @returns {Boolean} true if the given node should be added to the index.
   */
  select (node) {
    throw new Error('This method is abstract.')
  }

  clear () {
    throw new Error('This method is abstract')
  }

  /**
    Called when a node has been created.

    @param {Node} node
   */
  create (node) {
    throw new Error('This method is abstract.')
  }

  /**
    Called when a node has been deleted.

    @param {model/data/Node} node
   */
  delete (node) {
    throw new Error('This method is abstract.')
  }

  set (node, path, newValue, oldValue) {
    this.update(node, path, newValue, oldValue)
  }

  /**
    Called when a property has been updated.

    @private
    @param {Node} node
   */
  update (node, path, newValue, oldValue) {
    throw new Error('This method is abstract.')
  }

  /**
    Reset the index using a Data instance.

    @private
   */
  reset (data) {
    this.clear()
    this._initialize(data)
  }

  /**
    Clone this index.

    @return A cloned NodeIndex.
   */
  clone () {
    const NodeIndexClass = this.constructor
    const clone = new NodeIndexClass()
    return clone
  }

  _initialize (data) {
    for (const node of data.getNodes().values()) {
      if (this.select(node)) {
        this.create(node)
      }
    }
  }

  static create (prototype) {
    const index = Object.assign(new NodeIndex(), prototype)
    index.clone = function () {
      return NodeIndex.create(prototype)
    }
    return index
  }

  static filterByType (type) {
    return function (node) {
      return node.isInstanceOf(type)
    }
  }
}
