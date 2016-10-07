import isArray from 'lodash/isArray'
import forEach from 'lodash/forEach'

class JSONConverter {

  importDocument(doc, json) {
    if (!json.schema || !isArray(json.nodes)) {
      throw new Error('Invalid JSON format.')
    }
    var schema = doc.getSchema()
    if (schema.name !== json.schema.name) {
      throw new Error('Incompatible schema.')
    }
    if (schema.version !== json.schema.version) {
      console.error('Different schema version. Conversion might be problematic.')
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
        name: schema.name,
        version: schema.version
      },
      nodes: []
    }
    forEach(doc.getNodes(), function(node) {
      if (node._isDocumentNode) {
        json.nodes.push(node.toJSON())
      }
    })
    return json
  }
}

export default JSONConverter
