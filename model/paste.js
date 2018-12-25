import map from '../util/map'
import last from '../util/last'
import uuid from '../util/uuid'
import { deepDeleteNode, SNIPPET_ID, TEXT_SNIPPET_ID, removeAt, getContainerPosition, insertAt } from './documentHelpers'
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
  if (!sel || sel.isNull()) {
    throw new Error('Can not paste without selection.')
  }
  if (sel.isCustomSelection()) {
    throw new Error('Paste not implemented for custom selection.')
  }
  args = args || {}
  args.text = args.text || ''
  let pasteDoc = args.doc
  // TODO: is there a better way to detect that this paste is happening within a container?
  let inContainer = Boolean(sel.containerPath)
  // first delete the current selection
  if (!sel.isCollapsed()) {
    tx.deleteSelection()
  }
  // snippet is plain-text only
  if (!pasteDoc) {
    // in a PropertyEditor paste the text
    if (!inContainer) {
      tx.insertText(args.text)
      return
    // in a ContainerEditor interpret line-breaks
    // and create a document with multiple paragraphs
    } else {
      pasteDoc = _convertPlainTextToDocument(tx, args)
    }
  }
  // pasting into a TextProperty
  let snippet = pasteDoc.get(SNIPPET_ID)
  let L = snippet.getLength()
  if (L === 0) return
  let first = snippet.getNodeAt(0)
  // paste into a TextProperty
  if (!inContainer) {
    // if there is only one node it better be a text node
    // otherwise we can't do
    if (L === 1) {
      if (first.isText()) {
        _pasteAnnotatedText(tx, pasteDoc)
      }
    } else {
      pasteDoc = _convertIntoAnnotatedText(tx, pasteDoc)
      _pasteAnnotatedText(tx, pasteDoc)
    }
  } else {
    if (first.isText()) {
      _pasteAnnotatedText(tx, pasteDoc)
      // now we remove the first node from the snippet,
      // so that we can call _pasteDocument for the remaining
      // content
      snippet.removeAt(0)
      L--
    }
    // if still nodes left paste the remaining document
    if (L > 0) {
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
    container.append(node.id)
  } else {
    for (let i = 0; i < lines.length; i++) {
      node = pasteDoc.create({
        id: uuid(defaultTextType),
        type: defaultTextType,
        content: lines[i]
      })
      container.append(node.id)
    }
  }
  return pasteDoc
}

function _convertIntoAnnotatedText (tx, copy) {
  let sel = tx.selection
  let path = sel.start.path
  let snippet = tx.createSnippet()
  let defaultTextType = snippet.getSchema().getDefaultTextType()

  // walk through all nodes
  let container = copy.get('snippet')
  let nodeIds = container.getContent()
  // collect all transformed annotations
  let fragments = []
  let offset = 0
  let annos = []
  for (let nodeId of nodeIds) {
    let node = copy.get(nodeId)
    if (node.isText()) {
      let text = node.getText()
      if (fragments.length > 0) {
        fragments.push(' ')
        offset += 1
      }
      // tranform annos
      let _annos = map(node.getAnnotations(), anno => {
        let data = anno.toJSON()
        data.start.path = path.slice(0)
        data.start.offset += offset
        data.end.offset += offset
        return data
      })
      fragments.push(text)
      annos = annos.concat(_annos)
      offset += text.length
    }
  }
  snippet.create({
    id: TEXT_SNIPPET_ID,
    type: defaultTextType,
    content: fragments.join('')
  })
  annos.forEach(anno => snippet.create(anno))
  snippet.getContainer().append(TEXT_SNIPPET_ID)
  return snippet
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
  let targetProp = tx.getProperty(path)
  if (targetProp.isText()) {
    // copy annotations (only for TEXT properties)
    let annos = map(annotations)
    // NOTE: filtering annotations which are not explicitly white-listed via property.targetTypes
    let allowedTypes = targetProp.targetTypes
    if (allowedTypes) {
      annos = annos.filter(anno => allowedTypes.indexOf(anno.type) >= 0)
    }
    for (let anno of annos) {
      let data = anno.toJSON()
      data.start.path = path.slice(0)
      data.start.offset += offset
      data.end.offset += offset
      // create a new uuid if a node with the same id exists already
      if (tx.get(data.id)) data.id = uuid(data.type)
      tx.create(data)
    }
  }
}

function _pasteDocument (tx, pasteDoc) {
  let sel = tx.selection
  let containerPath = sel.containerPath
  let insertPos
  if (sel.isPropertySelection()) {
    let startPath = sel.start.path
    let nodeId = sel.start.getNodeId()
    let startPos = getContainerPosition(tx, containerPath, nodeId)
    let text = tx.get(startPath)
    // Break, unless we are at the last character of a node,
    // then we can simply insert after the node
    if (text.length === 0) {
      insertPos = startPos
      removeAt(tx, containerPath, insertPos)
      deepDeleteNode(tx, tx.get(nodeId))
    } else if (text.length === sel.start.offset) {
      insertPos = startPos + 1
    } else {
      tx.break()
      insertPos = startPos + 1
    }
  } else if (sel.isNodeSelection()) {
    let nodePos = getContainerPosition(tx, containerPath, sel.getNodeId())
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
  let nodes = nodeIds.map(id => pasteDoc.get(id))

  // now filter nodes w.r.t. allowed types for the given container
  let containerProperty = tx.getProperty(containerPath)
  let targetTypes = containerProperty.targetTypes
  // TODO: instead of dropping all invalid ones we could try to convert text nodes to the default text node
  if (targetTypes && targetTypes.length > 0) {
    nodes = nodes.filter(node => targetTypes.indexOf(node.type) >= 0)
  }
  for (let node of nodes) {
    // Note: this will on the one hand make sure node ids are changed
    // to avoid collisions in the target doc
    // Plus, it uses reflection to create owned nodes recursively,
    // and to transfer attached annotations.
    let newId = _transferWithDisambiguatedIds(node.getDocument(), tx, node.id, visited)
    // get the node in the targetDocument
    node = tx.get(newId)
    insertAt(tx, containerPath, insertPos++, newId)
    insertedNodes.push(node)
  }

  if (insertedNodes.length > 0) {
    let lastNode = last(insertedNodes)
    setCursor(tx, lastNode, containerPath, 'after')
  }
}
