import ObjectOperation from '../../model/data/ObjectOperation'
import map from '../../util/map'
import changeStoreSeed from './changeStoreSeed'

// Serializes to JSON
function buildSnapshot(changeset, schemaName) {
  let nodes = {}
  changeset.forEach((change) => {
    change.ops.forEach((op) => {
      op = ObjectOperation.fromJSON(op)
      op.apply(nodes)
    })
  })
  let doc = {
    nodes: nodes,
    schema: {
      name: schemaName
    }
  }
  return doc
}

var doc1V1 = buildSnapshot(changeStoreSeed['test-doc'], 'test-article')
var doc2V1 = buildSnapshot(changeStoreSeed['test-doc-2'], 'test-article')
var doc3V1 = buildSnapshot(changeStoreSeed['test-doc-3'].slice(0,1), 'test-article')

export default {
  'test-doc': {
    1: doc1V1
  },
  'test-doc-2': {
    1: doc2V1
  },
  'test-doc-3': {
    1: doc2V1
  }
}


