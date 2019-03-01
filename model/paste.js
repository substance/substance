import map from '../util/map'
import last from '../util/last'
import uuid from '../util/uuid'
import { deepDeleteNode, SNIPPET_ID, TEXT_SNIPPET_ID, removeAt, getContainerPosition, getContainerRoot, insertAt } from './documentHelpers'
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
  let snippet = pasteDoc.get(SNIPPET_ID)
  if (snippet.getLength() === 0) return

  let sel = tx.selection
  let containerPath = sel.containerPath
  let insertPos
  // FIXME: this does not work for lists
  // IMO we need to add a special implementation for lists
  // i.e. check if the cursor is inside a list-item, then either break the list if first node is not a list
  // otherwise merge the list into the current, and if there are more nodes then break the list and proceed on container level
  if (sel.isPropertySelection()) {
    let startPath = sel.start.path
    let node = getContainerRoot(tx, containerPath, sel.start.getNodeId())
    // if cursor is in a text node then break the text node
    // unless it is empty, then we remove the node
    // and if cursor is at the end we paste the content after the node
    if (node.isText()) {
      let startPos = node.getPosition()
      let text = tx.get(startPath)
      if (text.length === 0) {
        insertPos = startPos
        removeAt(tx, containerPath, insertPos)
        deepDeleteNode(tx, tx.get(node.id))
      } else if (text.length === sel.start.offset) {
        insertPos = startPos + 1
      } else {
        tx.break()
        insertPos = startPos + 1
      }
    // Special behavior for lists:
    // if the first pasted nodes happens to be a list, we merge it into the current list
    // otherwise we break the list into two lists pasting the remaining content inbetween
    // unless the list is empty, then we remove it
    // TODO: try to reuse code for breaking lists from Editing.js
    } else if (node.isList()) {
      let list = node
      let listItem = tx.get(sel.start.getNodeId())
      let first = snippet.getNodeAt(0)
      if (first.isList()) {
        if (first.getLength() > 0) {
          let itemPos = listItem.getPosition()
          if (listItem.getLength() === 0) {
            // replace the list item with the items from the pasted list
            removeAt(tx, list.getItemsPath(), itemPos)
            deepDeleteNode(tx, listItem)
            _pasteListItems(tx, list, first, itemPos)
          } else if (sel.start.offset === 0) {
            // insert items before the current list item
            _pasteListItems(tx, list, first, itemPos)
          } else if (sel.start.offset >= listItem.getLength()) {
            // insert items after the current list item
            _pasteListItems(tx, list, first, itemPos + 1)
          } else {
            tx.break()
            _pasteListItems(tx, list, first, itemPos + 1)
          }
          // if there is more content than just the list,
          // break the list apart
          if (snippet.getLength() > 1) {
            _breakListApart(tx, containerPath, list)
          }
        }
        // remove the first and continue with pasting the remaining content after the current list
        snippet.removeAt(0)
        insertPos = list.getPosition() + 1
      } else {
        // if the list is empty then remove it
        if (list.getLength() === 1 && listItem.getLength() === 0) {
          insertPos = list.getPosition()
          removeAt(tx, containerPath, insertPos)
          deepDeleteNode(tx, list)
        // if on first position of list, paste all content before the list
        } else if (listItem.getPosition() === 0 && sel.start.offset === 0) {
          insertPos = list.getPosition()
        // if cursor is at the last position of the list paste all content after the list
        } else if (listItem.getPosition() === list.getLength() - 1 && sel.end.offset >= listItem.getLength()) {
          insertPos = list.getPosition() + 1
        // break the list at the current position (splitting)
        } else {
          insertPos = list.getPosition() + 1
          _breakListApart(tx, containerPath, list)
        }
      }
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

  _pasteContainerNodes(tx, pasteDoc, containerPath, insertPos)
}

function _pasteContainerNodes (tx, pasteDoc, containerPath, insertPos) {
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

function _pasteListItems (tx, list, otherList, insertPos) {
  let sel = tx.getSelection()
  let items = otherList.resolve('items')
  let visited = {}
  let lastItem
  for (let item of items) {
    let newId = _transferWithDisambiguatedIds(item.getDocument(), tx, item.id, visited)
    insertAt(tx, list.getItemsPath(), insertPos++, newId)
    lastItem = tx.get(newId)
  }
  tx.setSelection({
    type: 'property',
    path: lastItem.getPath(),
    startOffset: lastItem.getLength(),
    surfaceId: sel.surfaceId,
    containerPath: sel.containerPath
  })
}

function _breakListApart (tx, containerPath, list) {
  // HACK: using tx.break() to break the list
  let nodePos = list.getPosition()
  // first split the current item with a break
  let oldSel = tx.selection
  tx.break()
  let listItem = tx.get(tx.selection.start.getNodeId())
  // if the list item is empty, another tx.break() splits the list
  // otherwise doing the same again
  if (listItem.getLength() > 0) {
    tx.setSelection(oldSel)
    tx.break()
  }
  console.assert(tx.get(tx.selection.start.getNodeId()).getLength() === 0, 'at this point the current list-item should be empty')
  // breaking a list on an empty list-item breaks the list apart
  // but this creates an empty paragraph which we need to removed
  // TODO: maybe we should add an option to tx.break() that allows break without insert of empty text node
  tx.break()
  let p = removeAt(tx, containerPath, nodePos + 1)
  deepDeleteNode(tx, p)
}
