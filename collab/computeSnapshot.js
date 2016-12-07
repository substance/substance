import ObjectOperation from '../model/data/ObjectOperation'

/*
  Compute snapshot based on a given doc (JSON) and a set of changes
*/
export default function computeSnapshot(jsonDoc, changeset) {
  // Clone the doc to make sure we don't manipulate in-place
  jsonDoc = JSON.parse(JSON.stringify(jsonDoc))
  let nodes = jsonDoc.nodes
  changeset.forEach((change) => {
    change.ops.forEach((op) => {
      op = ObjectOperation.fromJSON(op)
      op.apply(nodes)
    })
  })
  return jsonDoc
}