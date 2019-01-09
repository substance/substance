import forEach from '../util/forEach'
import NodeRegistry from './NodeRegistry'
import Node from './Node'

/**
  Schema for Data Objects.

  @internal
 */
export default class Schema {
  /**
    @param {String} name
    @param {String} version
  */
  constructor (options) {
    // new version of the API
    // the old one will be deprecated
    // because we think name and version should be optional
    if (arguments.length > 1) {
      console.warn('DEPRECATED: use "new Schema(options)" instead')
      options = { name: arguments[0], version: arguments[1] }
    }

    /**
      @type {String}
    */
    this.name = options.name
    /**
      @type {String}
    */
    this.version = options.version
    /**
      @type {NodeRegistry}
      @private
    */
    this.nodeRegistry = new NodeRegistry()

    // add built-in node classes
    this.addNodes(this.getBuiltIns())

    if (options.nodes) {
      this.addNodes(options.nodes)
    }
  }

  /**
    Add nodes to the schema.

    @param {Array} nodes Array of Node classes
  */
  addNodes (nodes) {
    if (!nodes) return
    forEach(nodes, NodeClass => {
      if (!NodeClass.prototype._isNode) {
        console.error('Illegal node class: ', NodeClass)
      } else {
        this.addNode(NodeClass)
      }
    })
  }

  addNode (NodeClass) {
    this.nodeRegistry.register(NodeClass)
  }

  /**
    Get the node class for a type name.

    @param {String} name
    @returns {Class}
  */
  getNodeClass (name, strict) {
    return this.nodeRegistry.get(name, strict)
  }

  /**
    Provide all built-in node classes.

    @private
    @returns {Node[]} An array of Node classes.
  */
  getBuiltIns () {
    return []
  }

  /**
    Checks if a given type is of given parent type.

    @param {String} type
    @param {String} parentType
    @returns {Boolean} true if type is and instance of parentType.
  */
  isInstanceOf (type, parentType) {
    var NodeClass = this.getNodeClass(type)
    if (NodeClass) {
      return Node.isInstanceOf(NodeClass, parentType)
    }
    return false
  }

  /**
    Iterate over all registered node classes.

    See {@link util/Registry#each}

    @param {Function} callback
    @param {Object} context
  */
  each (...args) {
    return this.nodeRegistry.each(...args)
  }

  /**
    @returns {String} the name of the default textish node (e.g. 'paragraph')
  */
  getDefaultTextType () {
    throw new Error('Schmema.prototype.getDefaultTextType() must be overridden.')
  }

  getNodeSchema (type) {
    var NodeClass = this.getNodeClass(type)
    if (!NodeClass) {
      console.error('Unknown node type ', type)
      return null
    }
    return NodeClass.schema
  }
}
