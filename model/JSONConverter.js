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
    const nodeEntries = json.nodes
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
    const visited = {}

    function _export (node) {
      if (!node) return
      if (visited[node.id]) return
      visited[node.id] = true
      const nodeSchema = node.getSchema()
      nodeSchema.getChildProperties().forEach(prop => {
        const val = node.get(prop.name)
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

    for (const node of doc.getNodes().values()) {
      _export(node)
    }

    return json
  }
}
