import Registry from '../deprecated/DeprecatedRegistry'
import isString from '../util/isString'

/*
  Registry for Nodes.

  @class NodeRegistry
  @extends util/Registry
 */
export default class NodeRegistry extends Registry {
  /**
    Register a Node class.

    @param {Class} nodeClass
   */
  register (nodeClazz) {
    var type = nodeClazz.prototype.type
    if (!isString(type) || !type) {
      throw new Error('Node type must be string and not empty')
    }
    if (!(nodeClazz.prototype._isNode)) {
      throw new Error('Nodes must be subclasses of Substance.Data.Node')
    }
    if (this.contains(type)) {
      // throw new Error('Node class is already registered: ' + type)
      console.info('Overriding node type', type)
      this.remove(type)
    }
    this.add(type, nodeClazz)
  }
}
