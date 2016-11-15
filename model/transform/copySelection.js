import cloneDeep from 'lodash/cloneDeep'
import forEach from '../../util/forEach'
import last from 'lodash/last'
import Document from '../Document'
import annotationHelpers from '../annotationHelpers'

/**
  Creates a new document instance containing only the selected content

  @param {Object} args object with `selection`
  @return {Object} with a `doc` property that has a fresh doc with the copied content
*/

function copySelection(tx, args) {
  let doc
  // legacy
  if (tx._isDocument) doc = tx
  else doc = tx.getDocument()
  let selection = args.selection
  if (!selection || !selection._isSelection) {
    throw new Error("'selection' is mandatory.")
  }
  if (selection.isNull() || selection.isCollapsed()) {
    args.doc = null
  }

  // return a simplified version if only a piece of text is selected
  else if (selection.isPropertySelection()) {
    args.doc = _copyPropertySelection(doc, selection)
  }
  else if (selection.isContainerSelection()) {
    args.doc = _copyContainerSelection(doc, selection)
  }
  else if (selection.isNodeSelection()) {
    args.doc = _copyNodeSelection(doc, selection)
  }
  else {
    console.error('Copy is not yet supported for selection type.')
    args.doc = null
  }
  return args
}

function _copyPropertySelection(doc, selection) {
  let path = selection.start.path
  let offset = selection.start.offset
  let endOffset = selection.end.offset
  let text = doc.get(path)
  let snippet = doc.createSnippet()
  let containerNode = snippet.getContainer()
  snippet.create({
    type: doc.schema.getDefaultTextType(),
    id: Document.TEXT_SNIPPET_ID,
    content: text.substring(offset, endOffset)
  })
  containerNode.show(Document.TEXT_SNIPPET_ID)
  let annotations = doc.getIndex('annotations').get(path, offset, endOffset)
  forEach(annotations, function(anno) {
    let data = cloneDeep(anno.toJSON())
    data.path = [Document.TEXT_SNIPPET_ID, 'content']
    data.startOffset = Math.max(offset, anno.startOffset)-offset
    data.endOffset = Math.min(endOffset, anno.endOffset)-offset
    snippet.create(data)
  })
  return snippet
}

// TODO: copying nested nodes is not straight-forward,
// as it is not clear if the node is valid to be created just partially
// Basically this needs to be implemented for each nested node.
// The default implementation ignores partially selected nested nodes.
function _copyContainerSelection(doc, selection) {
  let container = doc.get(selection.containerId)
  let snippet = doc.createSnippet()
  let containerNode = snippet.getContainer()

  let fragments = selection.getFragments()
  if (fragments.length === 0) return snippet
  let created = {}
  // copy nodes and annotations.
  for (let i = 0; i < fragments.length; i++) {
    let fragment = fragments[i]
    let nodeId = fragment.getNodeId()
    let node = doc.get(nodeId)
    // skip created nodes
    if (!created[nodeId]) {
      _copyNode(snippet, node, container, created)
      containerNode.show(nodeId)
    }
  }

  let firstFragment = fragments[0]
  let lastFragment = last(fragments)
  let path, offset, text

  // if first is a text node, remove part before the selection
  if (firstFragment.isPropertyFragment()) {
    path = firstFragment.path
    offset = firstFragment.startOffset
    text = doc.get(path)
    snippet.update(path, { type: 'delete', start: 0, end: offset })
    annotationHelpers.deletedText(snippet, path, 0, offset)
  }

  // if last is a is a text node, remove part before the selection
  if (lastFragment.isPropertyFragment()) {
    path = lastFragment.path
    offset = lastFragment.endOffset
    text = doc.get(path)
    snippet.update(path, { type: 'delete', start: offset, end: text.length })
    annotationHelpers.deletedText(snippet, path, offset, text.length)
  }

  return snippet
}

function _copyNodeSelection(doc, selection) {
  let container = doc.get(selection.containerId)
  let snippet = doc.createSnippet()
  let containerNode = snippet.getContainer()
  let nodeId = selection.getNodeId()
  let node = doc.get(nodeId)
  _copyNode(snippet, node, container, {})
  containerNode.show(node.id)
  return snippet
}

function _copyNode(doc, node, container, created) {
  // nested nodes should provide a custom implementation
  if (node.hasChildren()) {
    // TODO: call a customized implementation for nested nodes
    // and continue, to skip the default implementation
    let children = node.getChildren()
    children.forEach(function(child) {
      _copyNode(doc, child, container, created)
    })
  }
  created[node.id] = doc.create(node.toJSON())

  let annotationIndex = doc.getIndex('annotations')
  let annotations = annotationIndex.get([node.id])
  forEach(annotations, function(anno) {
    doc.create(cloneDeep(anno.toJSON()))
  })
}

export default copySelection
