import { cloneDeep, ObjectOperation } from 'substance'

// NOTE: this is essentially a copy of ../../collab/computeSnapshot
export default function computeSnapshot (jsonDoc, changeset) {
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
