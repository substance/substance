import last from '../util/last'
import forEach from '../util/forEach'
import uuid from '../util/uuid'
import { deleteNode, SNIPPET_ID, TEXT_SNIPPET_ID } from './documentHelpers'
import { setCursor } from './selectionHelpers'
import _transferWithDisambiguatedIds from './_transferWithDisambiguatedIds'

/**
  Pastes clipboard content at the current selection

  @param {Object} args object with `selection` and `doc` for Substance content or
  `text` for external HTML content
  @return {Object} with updated `selection`
*/
export default function paste (tx, args) {
  let sel = tx.selection
  if (!sel || sel.isNull() || sel.isCustomSelection()) {
    throw new Error('Can not paste, without selection or a custom selection.')
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
  if (pasteDoc && !inContainer) {
    // TODO: implement rich document import with merge into one paragraph
    let nodes = []
    let container = pasteDoc.get('snippet')
    let content = container.getContent()
    content.forEach(nodeId => {
      let text = pasteDoc.get(nodeId).getText()
      nodes.push(text)
    })
    tx.insertText(nodes.join('\r\n'))
    return
  }
  if (!sel.isCollapsed()) {
    tx.deleteSelection()
  }
  let snippet = pasteDoc.get(SNIPPET_ID)
  if (snippet.getLength() > 0) {
    let first = snippet.getChildAt(0)
    if (first.isText()) {
      _pasteAnnotatedText(tx, pasteDoc)
      // now we remove the first node from the snippet,
      // so that we can call _pasteDocument for the remaining
      // content
      snippet.hideAt(0)
    }
    // if still nodes left > 0
    if (snippet.getLength() > 0) {
      _pasteDocument(tx, pasteDoc)
    }
  }
  return args
}

/*
  Splits plain text by lines and puts them into paragraphs.
*/
function _convertPlainTextToDocument (tx, args) {
  let lines = args.text.split(/\s*\n\s*\n/)
  let pasteDoc = tx.getDocument().newInstance()
  let defaultTextType = pasteDoc.getSchema().getDefaultTextType()
  let container = pasteDoc.create({
    type: '@container',
    id: SNIPPET_ID,
    nodes: []
  })
  let node
  if (lines.length === 1) {
    node = pasteDoc.create({
      id: TEXT_SNIPPET_ID,
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
      container.show(node.id)
    }
  }
  return pasteDoc
}

function _pasteAnnotatedText (tx, copy) {
  let sel = tx.selection
  const nodes = copy.get(SNIPPET_ID).nodes
  const firstId = nodes[0]
  const first = copy.get(firstId)
  const textPath = first.getPath()
  const text = copy.get(textPath)
  const annotations = copy.getIndex('annotations').get(textPath)
  // insert plain text
  let path = sel.start.path
  let offset = sel.start.offset
  tx.insertText(text)
  // copy annotations
  forEach(annotations, function (anno) {
    let data = anno.toJSON()
    data.start.path = path.slice(0)
    data.start.offset += offset
    data.end.offset += offset
    // create a new uuid if a node with the same id exists already
    if (tx.get(data.id)) data.id = uuid(data.type)
    tx.create(data)
  })
}

function _pasteDocument (tx, pasteDoc) {
  let sel = tx.selection
  let containerId = sel.containerId
  let container = tx.get(containerId)
  let insertPos
  if (sel.isPropertySelection()) {
    let startPath = sel.start.path
    let nodeId = sel.start.getNodeId()
    let startPos = container.getPosition(nodeId, 'strict')
    let text = tx.get(startPath)
    // Break, unless we are at the last character of a node,
    // then we can simply insert after the node
    if (text.length === 0) {
      insertPos = startPos
      container.hide(nodeId)
      deleteNode(tx, tx.get(nodeId))
    } else if (text.length === sel.start.offset) {
      insertPos = startPos + 1
    } else {
      tx.break()
      insertPos = startPos + 1
    }
  } else if (sel.isNodeSelection()) {
    let nodePos = container.getPosition(sel.getNodeId(), 'strict')
    if (sel.isBefore()) {
      insertPos = nodePos
    } else if (sel.isAfter()) {
      insertPos = nodePos + 1
    } else {
      throw new Error('Illegal state: the selection should be collapsed.')
    }
  }
  // transfer nodes from content document
  let nodeIds = pasteDoc.get(SNIPPET_ID).nodes
  let insertedNodes = []
  let visited = {}
  for (let i = 0; i < nodeIds.length; i++) {
    let node = pasteDoc.get(nodeIds[i])
    // Note: this will on the one hand make sure
    // node ids are changed to avoid collisions in
    // the target doc
    // Plus, it uses reflection to create owned nodes recursively,
    // and to transfer attached annotations.
    let newId = _transferWithDisambiguatedIds(node.getDocument(), tx, node.id, visited)
    // get the node in the targetDocument
    node = tx.get(newId)
    container.showAt(insertPos++, newId)
    insertedNodes.push(node)
  }

  if (insertedNodes.length > 0) {
    let lastNode = last(insertedNodes)
    setCursor(tx, lastNode, containerId, 'after')
  }
}
