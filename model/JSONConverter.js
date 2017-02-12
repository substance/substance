import forEach from '../util/forEach'

class JSONConverter {

  importDocument(doc, json) {
    if (!json.nodes) {
      throw new Error('Invalid JSON format.')
    }
    var schema = doc.getSchema()
    if (json.schema && schema.name !== json.schema.name) {
      throw new Error('Incompatible schema.')
    }
    // the json should just be an array of nodes
    var nodes = json.nodes
    // import data in a block with deactivated indexers and listeners
    // as the data contains cyclic references which
    // cause problems.
    doc.import(function(tx) {
      forEach(nodes, function(node) {
        // overwrite existing nodes
        if (tx.get(node.id)) {
          tx.delete(node.id)
        }
        tx.create(node)
      })
    })
    return doc
  }

  exportDocument(doc) {
    var schema = doc.getSchema()
    var json = {
      schema: {
        name: schema.name
      },
      nodes: {}
    }
    forEach(doc.getNodes(), function(node) {
      if (node._isDocumentNode) {
        json.nodes[node.id] = node.toJSON()
      }
    })
    return json
  }
}

export default JSONConverter
