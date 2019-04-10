import forEach from '../util/forEach'

export default class JSONConverter {
  importDocument (doc, json) {
    if (!json.nodes) {
      throw new Error('Invalid JSON format.')
    }
    // the json should just be an array of nodes
    let nodes = json.nodes
    // import data in a block with deactivated indexers and listeners
    // as the data may contain cyclic references which causes problems.
    doc.import(function (tx) {
      forEach(nodes, function (node) {
        // overwrite existing nodes
        if (tx.get(node.id)) {
          tx.delete(node.id)
        }
        tx.create(node)
      })
    })
    return doc
  }

  exportDocument (doc) {
    let json = {
      nodes: {}
    }
    forEach(doc.getNodes(), function (node) {
      if (node._isDocumentNode) {
        json.nodes[node.id] = node.toJSON()
      }
    })
    return json
  }
}
