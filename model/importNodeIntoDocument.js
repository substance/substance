import _transferWithDisambiguatedIds from './_transferWithDisambiguatedIds'

export default function importNodeIntoDocument (targetDoc, node) {
  let sourceDoc = node.getDocument()
  let newId = _transferWithDisambiguatedIds(sourceDoc, targetDoc, node.id, {})
  return targetDoc.get(newId)
}
