import { Registry } from '../util'

/*
  Registry for Nodes.

  @class NodeRegistry
  @extends util/Registry
 */
class NodeRegistry extends Registry {
  /**
    Register a Node class.

    @param {Class} nodeClass
   */
  register(nodeClazz) {
    var type = nodeClazz.prototype.type
    if ( typeof type !== 'string' || type === '' ) {
      throw new Error( 'Node names must be strings and must not be empty')
    }
    if (!( nodeClazz.prototype._isNode)) {
      throw new Error( 'Nodes must be subclasses of Substance.Data.Node' )
    }
    if (this.contains(type)) {
      // throw new Error('Node class is already registered: ' + type)
      console.info('Overriding node type', type)
      this.remove(type)
    }
    this.add(type, nodeClazz)
  }

}

export default NodeRegistry
