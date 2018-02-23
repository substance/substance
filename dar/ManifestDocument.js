import XMLDocument from '../xml/XMLDocument'
import ManifestSchema from './ManifestSchema'

export default class ManifestDocument extends XMLDocument {

  getRootNode() {
    if (!this.root) {
      let nodes = this.getNodes()
      let ids = Object.keys(nodes)
      for (var i = 0; i < ids.length; i++) {
        let node = nodes[ids[i]]
        if (node.type === 'dar') {
          this.root = node
        }
      }
    }
    return this.root
  }

  getDocTypeParams() {
    return ManifestSchema.getDocTypeParams()
  }

  getXMLSchema() {
    return ManifestSchema
  }

  getDocumentNodes() {
    return this.findAll('documents > document')
  }

  getAssetNodes() {
    return this.findAll('assets > asset')
  }

}
