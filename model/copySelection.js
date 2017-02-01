import cloneDeep from '../util/cloneDeep'
import forEach from '../util/forEach'
import Document from './Document'
import documentHelpers from './documentHelpers'
import { isFirst, isLast } from './selectionHelpers'

/**
  Creates a new document instance containing only the selected content

  @param {Object} args object with `selection`
  @return {Object} with a `doc` property that has a fresh doc with the copied content
*/

function copySelection(doc, selection) {
  if (!selection) throw new Error("'selection' is mandatory.")
  let copy = null
  if (!selection.isNull() && !selection.isCollapsed()) {
    // return a simplified version if only a piece of text is selected
    if (selection.isPropertySelection()) {
      copy = _copyPropertySelection(doc, selection)
    }
    else if (selection.isContainerSelection()) {
      copy = _copyContainerSelection(doc, selection)
    }
    else if (selection.isNodeSelection()) {
      copy = _copyNodeSelection(doc, selection)
    }
    else {
      console.error('Copy is not yet supported for selection type.')
    }
  }
  return copy
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
    let path = [Document.TEXT_SNIPPET_ID, 'content']
    data.start = {
      path: path,
      offset: Math.max(offset, anno.start.offset)-offset
    }
    data.end = {
      path: path,
      offset: Math.min(endOffset, anno.end.offset)-offset
    }
    snippet.create(data)
  })
  return snippet
}

function _copyContainerSelection(tx, sel) {
  let snippet = tx.createSnippet()
  let container = snippet.getContainer()

  let nodeIds = sel.getNodeIds()
  let L = nodeIds.length
  if (L === 0) return snippet

  let start = sel.start
  let end = sel.end

  let skippedFirst = false
  let skippedLast = false

  // First copy the whole covered nodes
  let created = {}
  for(let i = 0; i<L; i++) {
    let id = nodeIds[i]
    let node = tx.get(id)
    // skip NIL selections, such as cursor at the end of first node or cursor at the start of last node.
    if (i===0 && isLast(tx, start)) {
      skippedFirst = true
      continue
    }
    if (i===L-1 && isFirst(tx, end)) {
      skippedLast = true
      continue
    }
    if (!created[id]) {
      documentHelpers.copyNode(node).forEach((nodeData) => {
        let copy = snippet.create(nodeData)
        created[copy.id] = true
      })
      container.show(id)
    }
  }
  if (!skippedFirst) {
    // ATTENTION: we need the root node here, e.g. the list, not the list items
    let startNode = snippet.get(start.getNodeId()).getRoot()
    if (startNode.isText()) {
      documentHelpers.deleteTextRange(snippet, null, start)
    } else if (startNode.isList()) {
      documentHelpers.deleteListRange(snippet, startNode, null, start)
    }
  }
  if (!skippedLast) {
    // ATTENTION: we need the root node here, e.g. the list, not the list items
    let endNode = snippet.get(end.getNodeId()).getRoot()
    if (endNode.isText()) {
      documentHelpers.deleteTextRange(snippet, end, null)
    } else if (endNode.isList()) {
      documentHelpers.deleteListRange(snippet, endNode, end, null)
    }
  }
  return snippet
}

function _copyNodeSelection(doc, selection) {
  let snippet = doc.createSnippet()
  let containerNode = snippet.getContainer()
  let nodeId = selection.getNodeId()
  let node = doc.get(nodeId)
  documentHelpers.copyNode(node).forEach((nodeData) => {
    snippet.create(nodeData)
  })
  containerNode.show(node.id)
  return snippet
}


export default copySelection
