import isArray from '../util/isArray'
import last from '../util/last'
import forEach from '../util/forEach'
import uuid from '../util/uuid'
import Document from '../model/Document'
import documentHelpers from '../model/documentHelpers'
import { setCursor } from '../model/selectionHelpers'

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
    data.start.path = path.slice(0)
    data.start.offset += offset
    data.end.offset += offset
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
    let nodeId = sel.start.getNodeId()
    let startPos = container.getPosition(nodeId, 'strict')
    let text = tx.get(startPath)
    // Break, unless we are at the last character of a node,
    // then we can simply insert after the node
    if (text.length === 0) {
      insertPos = startPos
      container.hide(nodeId)
      documentHelpers.deleteNode(tx, tx.get(nodeId))
    } else if ( text.length === sel.start.offset ) {
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
      insertPos = nodePos+1
    } else {
      throw new Error('Illegal state: the selection should be collapsed.')
    }
  }
  // transfer nodes from content document
  let nodeIds = pasteDoc.get(Document.SNIPPET_ID).nodes
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
    container.show(newId, insertPos++)
    insertedNodes.push(node)
  }

  if (insertedNodes.length > 0) {
    let lastNode = last(insertedNodes)
    setCursor(tx, lastNode, containerId, 'after')
  }
}

// We need to disambiguate ids if the target document
// contains a node with the same id.
// Unfortunately, this can be difficult in some cases,
// e.g. other nodes that have a reference to the re-named node
// We only fix annotations for now.
function _transferWithDisambiguatedIds(sourceDoc, targetDoc, id, visited) {
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
  for (let key in nodeSchema) {
    if (key === 'id' || key === 'type' || !nodeSchema.hasOwnProperty(key)) continue
    const prop = nodeSchema[key]
    const name = prop.name
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
    }
    // Look for text properties and create annotations in the target doc accordingly
    else if (prop.isText()) {
      let _annos = annotationIndex.get([node.id])
      for (let i = 0; i < _annos.length; i++) {
        let anno = _annos[i]
        if (anno.start.path[0] === oldId) {
          anno.start.path[0] = newId
        }
        if (anno.end.path[0] === oldId) {
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

function _transferArrayOfReferences(sourceDoc, targetDoc, arr, visited) {
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

export default paste
