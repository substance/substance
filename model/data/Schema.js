import each from 'lodash/each'
import NodeRegistry from './NodeRegistry'
import Node from './Node'

/**
  Schema for Data Objects.

  @internal
 */
class Schema {

  /**
    @param {String} name
    @param {String} version
  */
  constructor(name, version) {
    /**
      @type {String}
    */
    this.name = name
    /**
      @type {String}
    */
    this.version = version
    /**
      @type {NodeRegistry}
      @private
    */
    this.nodeRegistry = new NodeRegistry()
    /**
      @type {Array} all Node classes which have `Node.tocType = true`
      @private
    */
    this.tocTypes = []

    // add built-in node classes
    this.addNodes(this.getBuiltIns())
  }

  /**
    Add nodes to the schema.

    @param {Array} nodes Array of Node classes
  */
  addNodes(nodes) {
    if (!nodes) return
    each(nodes, function(NodeClass) {
      if (!NodeClass.prototype._isNode) {
        console.error('Illegal node class: ', NodeClass)
      } else {
        this.addNode(NodeClass)
      }
    }.bind(this))
  }

  addNode(NodeClass) {
    this.nodeRegistry.register(NodeClass)
    if (NodeClass.tocType) {
      this.tocTypes.push(NodeClass.type)
    }
  }

  /**
    Get the node class for a type name.

    @param {String} name
    @returns {Class}
  */
  getNodeClass(name) {
    return this.nodeRegistry.get(name)
  }

  /**
    Provide all built-in node classes.

    @private
    @returns {Node[]} An array of Node classes.
  */
  getBuiltIns() {
    return []
  }

  /**
    Checks if a given type is of given parent type.

    @param {String} type
    @param {String} parentType
    @returns {Boolean} true if type is and instance of parentType.
  */
  isInstanceOf(type, parentType) {
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
  each() {
    this.nodeRegistry.each.apply(this.nodeRegistry, arguments)
  }

  /**
    @returns {Node[]} list of types that should appear in a TOC
  */
  getTocTypes() {
    return this.tocTypes
  }

  /**
    @returns {String} the name of the default textish node (e.g. 'paragraph')
  */
  getDefaultTextType() {
    throw new Error('Schmema.prototype.getDefaultTextType() must be overridden.')
  }

  getNodeSchema(type) {
    var NodeClass = this.getNodeClass(type)
    if (!NodeClass) {
      console.error('Unknown node type ', type)
      return null
    }
    return NodeClass.schema
  }
}

export default Schema
