export default class DocumentNodeFactory {
  constructor (doc) {
    this.doc = doc
  }

  create (nodeType, nodeData) {
    const NodeClass = this.doc.schema.getNodeClass(nodeType)
    if (!NodeClass) {
      throw new Error('No node registered by that name: ' + nodeType)
    }
    return new NodeClass(this.doc, nodeData)
  }
}
