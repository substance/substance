import isArray from '../util/isArray'
import uuid from '../util/uuid'

// We need to disambiguate ids if the target document
// contains a node with the same id.
// Unfortunately, this can be difficult in some cases,
// e.g. other nodes that have a reference to the re-named node
// We only fix annotations for now.
export default function _transferWithDisambiguatedIds (sourceDoc, targetDoc, id, visited) {
  if (visited[id]) throw new Error('FIXME: dont call me twice')
  const node = sourceDoc.get(id, 'strict')
  let oldId = node.id
  let newId
  if (targetDoc.contains(node.id)) {
    // change the node id
    newId = uuid(node.type)
    node.id = newId
  }
  visited[id] = node.id
  const annotationIndex = sourceDoc.getIndex('annotations')
  const nodeSchema = node.getSchema()
  // collect annotations so that we can create them in the target doc afterwards
  let annos = []
  // now we iterate all properties of the node schema,
  // to see if there are owned references, which need to be created recursively,
  // and if there are text properties, where annotations could be attached to
  for (let prop of nodeSchema) {
    const name = prop.name
    if (name === 'id' || name === 'type') continue
    // Look for references to owned children and create recursively
    if ((prop.isReference() && prop.isOwned()) || (prop.type === 'file')) {
      // NOTE: we need to recurse directly here, so that we can
      // update renamed references
      let val = node[prop.name]
      if (prop.isArray()) {
        _transferArrayOfReferences(sourceDoc, targetDoc, val, visited)
      } else {
        let id = val
        if (!visited[id]) {
          node[name] = _transferWithDisambiguatedIds(sourceDoc, targetDoc, id, visited)
        }
      }
    // Look for text properties and create annotations in the target doc accordingly
    } else if (prop.isText()) {
      // This is really difficult in general
      // as we don't know where to look for.
      // TODO: ATM we only look for annotations.
      // We should also consider anchors / container-annotations
      // Probably we need a different approach, may
      let _annos = annotationIndex.get([oldId, prop.name])
      for (let i = 0; i < _annos.length; i++) {
        let anno = _annos[i]
        if (anno.start.path[0] === oldId && newId) {
          anno.start.path[0] = newId
        }
        if (anno.end.path[0] === oldId && newId) {
          anno.end.path[0] = newId
        }
        annos.push(anno)
      }
    }
  }
  targetDoc.create(node)
  for (let i = 0; i < annos.length; i++) {
    _transferWithDisambiguatedIds(sourceDoc, targetDoc, annos[i].id, visited)
  }
  return node.id
}

function _transferArrayOfReferences (sourceDoc, targetDoc, arr, visited) {
  for (let i = 0; i < arr.length; i++) {
    let val = arr[i]
    // multi-dimensional
    if (isArray(val)) {
      _transferArrayOfReferences(sourceDoc, targetDoc, val, visited)
    } else {
      let id = val
      if (id && !visited[id]) {
        arr[i] = _transferWithDisambiguatedIds(sourceDoc, targetDoc, id, visited)
      }
    }
  }
}
