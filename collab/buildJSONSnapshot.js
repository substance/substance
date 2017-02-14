import ObjectOperation from '../model/data/ObjectOperation'

export default function buildJSONSnapshot(rawSnapshot, changes) {
  let snapshot
  if (rawSnapshot) {
    snapshot = JSON.parse(rawSnapshot)
  } else {
    // Build a snapshot from scratch
    snapshot = { nodes: {} }
  }
  _applyChanges(snapshot, changes)
  return JSON.stringify(snapshot)
}

function _applyChanges(snapshot, changes) {
  let nodes = snapshot.nodes
  changes.forEach((change) => {
    change.ops.forEach((opData) => {
      try {
        let op = ObjectOperation.fromJSON(opData)
        op.apply(nodes)
      } catch (err) {
        console.error(err, opData)
      }
    })
  })
}
