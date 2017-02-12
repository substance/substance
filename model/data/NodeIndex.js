import forEach from '../../util/forEach'

/**
  Index for Nodes.

  Node indexes are first-class citizens in {@link model/data/Data}.
  I.e., they are updated after each operation, and before any other listener is notified.

  @abstract

 */
class NodeIndex {

  /**
    Check if a node should be indexed.

    Used internally only. Override this in subclasses to achieve a custom behavior.

    @private
    @param {Node}
    @returns {Boolean} true if the given node should be added to the index.
   */
  select(node) { // eslint-disable-line no-unused-vars
    throw new Error('This method is abstract.')
  }

  /**
    Called when a node has been created.

    @param {Node} node
   */
  create(node) { // eslint-disable-line no-unused-vars
    throw new Error('This method is abstract.')
  }

  /**
    Called when a node has been deleted.

    @param {model/data/Node} node
   */
  delete(node) { // eslint-disable-line no-unused-vars
    throw new Error('This method is abstract.')
  }

  set(node, path, newValue, oldValue) {
    this.update(node, path, newValue, oldValue)
  }

  /**
    Called when a property has been updated.

    @private
    @param {Node} node
   */
  update(node, path, newValue, oldValue) { // eslint-disable-line no-unused-vars
    throw new Error('This method is abstract.')
  }

  /**
    Reset the index using a Data instance.

    @private
   */
  reset(data) {
    this._clear()
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

  _clear() {
    throw new Error('This method is abstract')
  }

  _initialize(data) {
    forEach(data.getNodes(), function(node) {
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
