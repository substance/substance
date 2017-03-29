class NodeFactory {

  constructor(nodeRegistry) {
    this.nodeRegistry = nodeRegistry
  }

  create(nodeType, nodeData) {
    var NodeClass = this.nodeRegistry.get(nodeType)
    if (!NodeClass) {
      throw new Error('No Node registered by that name: ' + nodeType)
    }
    return new NodeClass(nodeData)
  }
}

export default NodeFactory
