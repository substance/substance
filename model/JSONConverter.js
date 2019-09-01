import { isArray } from '../util'

/*
  Note: this implementation is different to the core implementation
  in that regard that it serializes child nodes before their parents
*/
export default class JSONConverter {
  importDocument (doc, json) {
    if (!json.nodes) {
      throw new Error('Invalid JSON format.')
    }
    // the json should just be an array of nodes
    let nodeEntries = json.nodes
    doc.import(tx => {
      nodeEntries.forEach(data => tx.create(data))
    })
    return doc
  }

  exportDocument (doc) {
    var schema = doc.getSchema()
    var json = {
      schema: {
        name: schema.name
      },
      nodes: []
    }
    let visited = {}

    function _export (node) {
      if (!node) return
      if (visited[node.id]) return
      visited[node.id] = true
      let nodeSchema = node.getSchema()
      nodeSchema.getOwnedProperties().forEach(prop => {
        let val = node.get(prop.name)
        if (isArray(val)) {
          val.forEach(id => {
            _export(doc.get(id))
          })
        } else {
          _export(doc.get(val))
        }
      })
      json.nodes.push(node.toJSON())
    }

    for (let node of doc.getNodes().values()) {
      _export(node)
    }

    return json
  }
}
