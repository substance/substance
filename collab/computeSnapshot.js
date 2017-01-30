import { cloneDeep } from 'lodash-es'
import ObjectOperation from '../model/data/ObjectOperation'

/*
  Compute snapshot based on a given doc (JSON) and a set of changes
*/
export default function computeSnapshot(jsonDoc, changeset) {
  // Clone the doc to make sure we don't manipulate in-place
  jsonDoc = cloneDeep(jsonDoc)
  let nodes = jsonDoc.nodes
  changeset.forEach((change) => {
    change.ops.forEach((opData) => {
      try {
        let op = ObjectOperation.fromJSON(opData)
        op.apply(nodes)
      } catch (err) {
        console.error(err, opData)
      }
    })
  })
  return jsonDoc
}