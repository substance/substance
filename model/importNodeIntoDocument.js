import _transferWithDisambiguatedIds from './_transferWithDisambiguatedIds'

export default function importNodeIntoDocument (targetDoc, node) {
  const sourceDoc = node.getDocument()
  const newId = _transferWithDisambiguatedIds(sourceDoc, targetDoc, node.id, {}, {})
  return targetDoc.get(newId)
}
