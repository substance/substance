class DocumentNodeFactory {

  constructor(doc) {
    this.doc = doc
  }

  create(nodeType, nodeData) {
    var NodeClass = this.doc.schema.getNodeClass(nodeType)
    if (!NodeClass) {
      throw new Error('No node registered by that name: ' + nodeType)
    }
    return new NodeClass(this.doc, nodeData)
  }
}

export default DocumentNodeFactory
