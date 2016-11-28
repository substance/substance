import last from 'lodash/last'
import forEach from '../../util/forEach'
import uuid from '../../util/uuid'
import Document from '../Document'

/**
  Pastes clipboard content at the current selection

  @param {Object} args object with `selection` and `doc` for Substance content or
  `text` for external HTML content
  @return {Object} with updated `selection`
*/

function paste(tx, args) {
  let sel = tx.selection
  if (!sel || sel.isNull()) {
    throw new Error("Can not paste, without selection.")
  }
  args = args || {}
  args.text = args.text || ''
  let pasteDoc = args.doc
  // TODO: is there a better way to detect that this paste is happening within a
  // container?
  let inContainer = Boolean(sel.containerId)

  // when we are in a container, we interpret line-breaks
  // and create a document with multiple paragraphs
  // in a PropertyEditor we paste the text as is
  if (!pasteDoc && !inContainer) {
    tx.insertText(args.text)
    return
  }
  if (!pasteDoc) {
    pasteDoc = _convertPlainTextToDocument(tx, args)
  }
  if (!sel.isCollapsed()) {
    tx.deleteSelection()
  }
  let nodes = pasteDoc.get(Document.SNIPPET_ID).nodes
  let schema = tx.getSchema()
  if (nodes.length > 0) {
    let first = pasteDoc.get(nodes[0])
    if (schema.isInstanceOf(first.type, 'text')) {
      _pasteAnnotatedText(tx, pasteDoc)
      // HACK: this changes the container's nodes array.
      // We do this, to be able to call _pasteDocument inserting the remaining nodes
      nodes.shift()
    }
    // if still nodes left > 0
    if (nodes.length > 0) {
      _pasteDocument(tx, pasteDoc)
    }
  }
  return args
}

/*
  Splits plain text by lines and puts them into paragraphs.
*/
function _convertPlainTextToDocument(tx, args) {
  let lines = args.text.split(/\s*\n\s*\n/)
  let pasteDoc = tx.getDocument().newInstance()
  let defaultTextType = pasteDoc.getSchema().getDefaultTextType()
  let container = pasteDoc.create({
    type: 'container',
    id: Document.SNIPPET_ID,
    nodes: []
  })
  let node
  if (lines.length === 1) {
    node = pasteDoc.create({
      id: Document.TEXT_SNIPPET_ID,
      type: defaultTextType,
      content: lines[0]
    })
    container.show(node.id)
  } else {
    for (let i = 0; i < lines.length; i++) {
      node = pasteDoc.create({
        id: uuid(defaultTextType),
        type: defaultTextType,
        content: lines[i]
      })
      container.show(node.id);
    }
  }
  return pasteDoc
}

function _pasteAnnotatedText(tx, copy) {
  let sel = tx.selection
  let nodes = copy.get(Document.SNIPPET_ID).nodes
  let textPath = [nodes[0], 'content']
  let text = copy.get(textPath)
  let annotations = copy.getIndex('annotations').get(textPath)
  // insert plain text
  let path = sel.start.path
  let offset = sel.start.offset
  tx.insertText(text)
  // copy annotations
  forEach(annotations, function(anno) {
    let data = anno.toJSON()
    data.path = path.slice(0)
    data.startOffset += offset
    data.endOffset += offset
    // create a new uuid if a node with the same id exists already
    if (tx.get(data.id)) data.id = uuid(data.type)
    tx.create(data)
  })
}

function _pasteDocument(tx, pasteDoc) {
  let sel = tx.selection
  let containerId = sel.containerId
  let container = tx.get(containerId)
  let insertPos
  if (sel.isPropertySelection()) {
    let startPath = sel.start.path
    let startPos = container.getPosition(sel.start.getNodeId())
    let text = tx.get(startPath)
    // Break, unless we are at the last character of a node,
    // then we can simply insert after the node
    if ( text.length === sel.start.offset ) {
      insertPos = startPos + 1
    } else {
      tx.break()
      insertPos = startPos + 1
    }
  } else if (sel.isNodeSelection()) {
    let nodePos = container.getPosition(sel.getNodeId())
    if (sel.isBefore()) {
      insertPos = nodePos
    } else if (sel.isAfter()) {
      insertPos = nodePos+1
    } else {
      throw new Error('Illegal state: the selection should be collapsed.')
    }
  }

  // TODO how should this check be useful?
  if (insertPos < 0) {
    console.error('Could not find insertion position in ContainerNode.')
  }
  // transfer nodes from content document
  let nodeIds = pasteDoc.get(Document.SNIPPET_ID).nodes
  let annoIndex = pasteDoc.getIndex('annotations')
  let insertedNodes = []
  for (let i = 0; i < nodeIds.length; i++) {
    let nodeId = nodeIds[i]
    let node = _copyNode(tx, pasteDoc.get(nodeId))
    container.show(node.id, insertPos++)
    insertedNodes.push(node)
    // transfer annotations
    // what if we have changed the id of nodes that are referenced by annotations?
    let annos = annoIndex.get(nodeId)
    for (let j = 0; j < annos.length; j++) {
      let data = annos[j].toJSON()
      if (node.id !== nodeId) {
        data.path[0] = node.id
      }
      if (tx.get(data.id)) {
        data.id = uuid(data.type)
      }
      tx.create(data)
    }
  }

  if (insertedNodes.length > 0) {
    // select the whole pasted block
    let firstNode = insertedNodes[0]
    let lastNode = last(insertedNodes)
    tx.select({
      startPath: [firstNode.id],
      startOffset: 0,
      endPath: [lastNode.id],
      endOffset: 1,
    })
  }
}

function _copyNode(tx, pasteNode) {
  let nodeId = pasteNode.id
  let data = pasteNode.toJSON()
  // create a new id if the node exists already
  if (tx.get(nodeId)) {
    data.id = uuid(pasteNode.type)
  }
  if (pasteNode.hasChildren()) {
    let children = pasteNode.getChildren()
    let childrenIds = data[pasteNode.getChildrenProperty()]
    for (let i = 0; i < children.length; i++) {
      let childNode = _copyNode(tx, children[i])
      childrenIds[i] = childNode.id
    }
  }
  return tx.create(data)
}

export default paste
