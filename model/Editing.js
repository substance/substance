import isArrayEqual from '../util/isArrayEqual'
import isString from '../util/isString'
import uuid from '../util/uuid'
import annotationHelpers from './annotationHelpers'
import {
  deleteTextRange, deleteNode, deleteListRange, mergeListItems,
  insertAt, removeAt, getContainerRoot, getContainerPosition, getNextNode, getPreviousNode
} from './documentHelpers'
import { setCursor, isEntirelySelected, selectNode } from './selectionHelpers'
import paste from './paste'

/**
  Core editing implementation, that controls meta behavior
  such as deleting a selection, merging nodes, etc.

  Some of the implementation are then delegated to specific editing behaviors,
  such as manipulating content of a text-property, merging or breaking text nodes

  Note: this is pretty much the same what we did with transforms before.
        We decided to move this here, to switch to a stateful editor implementation (aka turtle-graphics-style)
 */
export default class Editing {
  // create an annotation for the current selection using the given data
  annotate (tx, annotation) {
    let sel = tx.selection
    let schema = tx.getSchema()
    let AnnotationClass = schema.getNodeClass(annotation.type)
    if (!AnnotationClass) throw new Error('Unknown annotation type', annotation)
    let start = sel.start
    let end = sel.end
    let containerPath = sel.containerPath
    let nodeData = { start, end, containerPath }
    // TODO: we need to generalize how node category can be derived statically
    /* istanbul ignore else  */
    if (sel.isPropertySelection()) {
      if (!AnnotationClass.isAnnotation()) {
        throw new Error('Annotation can not be created for a selection.')
      }
    } else if (sel.isContainerSelection()) {
      if (AnnotationClass.isPropertyAnnotation()) {
        console.warn('NOT SUPPORTED YET: creating property annotations for a non collapsed container selection.')
      }
    }
    Object.assign(nodeData, annotation)
    return tx.create(nodeData)
  }

  break (tx) {
    let sel = tx.selection
    if (sel.isNodeSelection()) {
      let containerPath = sel.containerPath
      let nodeId = sel.getNodeId()
      let node = tx.get(nodeId)
      let nodePos = node.getXpath().pos
      let textNode = this.createTextNode(tx, containerPath)
      if (sel.isBefore()) {
        insertAt(tx, containerPath, nodePos, textNode.id)
        // leave selection as is
      } else {
        insertAt(tx, containerPath, nodePos + 1, textNode.id)
        setCursor(tx, textNode, containerPath, 'before')
      }
    } else if (sel.isCustomSelection()) {
      // TODO: what to do with custom selections?
    } else if (sel.isCollapsed() || sel.isPropertySelection()) {
      let containerPath = sel.containerPath
      if (!sel.isCollapsed()) {
        // delete the selection
        this._deletePropertySelection(tx, sel)
        tx.setSelection(sel.collapse('left'))
      }
      // then break the node
      if (containerPath) {
        let nodeId = sel.start.path[0]
        let node = tx.get(nodeId)
        this._breakNode(tx, node, sel.start, containerPath)
      }
    } else if (sel.isContainerSelection()) {
      let start = sel.start
      let containerPath = sel.containerPath
      let startNodeId = start.path[0]
      let startNode = tx.get(startNodeId)
      let nodePos = startNode.getXpath().pos
      this._deleteContainerSelection(tx, sel, { noMerge: true })
      setCursor(tx, getNextNode(tx, containerPath, nodePos), containerPath, 'before')
    }
  }

  createTextNode (tx, containerPath, text) { // eslint-disable-line no-unused-vars
    let prop = tx.getProperty(containerPath)
    if (!prop.defaultTextType) {
      throw new Error('Container properties must have a "defaultTextType" defined in the schema')
    }
    return tx.create({
      type: prop.defaultTextType,
      content: text
    })
  }

  createListNode (tx, containerPath, params = {}) { // eslint-disable-line no-unused-vars
    // Note: override this create a different node type
    // according to the context
    return tx.create({ type: 'list', items: [], listType: params.listType || 'bullet' })
  }

  delete (tx, direction) {
    let sel = tx.selection
    // special implementation for node selections:
    // either delete the node (replacing with an empty text node)
    // or just move the cursor
    /* istanbul ignore else  */
    if (sel.isNodeSelection()) {
      this._deleteNodeSelection(tx, sel, direction)
    // TODO: what to do with custom selections?
    } else if (sel.isCustomSelection()) {
    // if the selection is collapsed this is the classical one-character deletion
    // either backwards (backspace) or forward (delete)
    } else if (sel.isCollapsed()) {
      // Deletion of a single character leads to a merge
      // if cursor is at a text boundary (TextNode, ListItem)
      // and direction is towards that boundary
      let path = sel.start.path
      let nodeId = path[0]
      let containerPath = sel.containerPath
      let text = tx.get(path)
      let offset = sel.start.offset
      let needsMerge = (containerPath && (
        (offset === 0 && direction === 'left') ||
        (offset === text.length && direction === 'right')
      ))
      if (needsMerge) {
        // ATTENTION: deviation from standard implementation
        // for list items: Word and GDoc toggle a list item
        // when doing a BACKSPACE at the first position
        // IMO this is not 'consistent' because it is not the
        // inverse of 'break'
        // We will 'toggle' only if the cursor is on the first position
        // of the first item
        let root = getContainerRoot(tx, containerPath, nodeId)
        if (root.isList() && offset === 0 && direction === 'left') {
          return this.toggleList(tx)
        } else {
          this._merge(tx, root, sel.start, direction, sel.containerPath)
        }
      } else {
        // if we are not in a merge scenario, we stop at the boundaries
        if ((offset === 0 && direction === 'left') ||
          (offset === text.length && direction === 'right')) {
          return
        }
        let startOffset = (direction === 'left') ? offset - 1 : offset
        let endOffset = startOffset + 1
        let start = { path: path, offset: startOffset }
        let end = { path: path, offset: endOffset }
        deleteTextRange(tx, start, end)
        tx.setSelection({
          type: 'property',
          path: path,
          startOffset: startOffset,
          containerPath: sel.containerPath
        })
      }
    // deleting a range of characters within a text property
    } else if (sel.isPropertySelection()) {
      deleteTextRange(tx, sel.start, sel.end)
      tx.setSelection(sel.collapse('left'))
    // deleting a range within a container (across multiple nodes)
    } else if (sel.isContainerSelection()) {
      this._deleteContainerSelection(tx, sel)
    } else {
      console.warn('Unsupported case: tx.delete(%)', direction, sel)
    }
  }

  _deleteNodeSelection (tx, sel, direction) {
    let nodeId = sel.getNodeId()
    let containerPath = sel.containerPath
    let node = tx.get(nodeId)
    let nodePos = node.getXpath().pos
    if (sel.isFull() ||
        (sel.isBefore() && direction === 'right') ||
        (sel.isAfter() && direction === 'left')) {
      // replace the node with default text node
      removeAt(tx, containerPath, nodePos)
      deleteNode(tx, tx.get(nodeId))
      let newNode = this.createTextNode(tx, sel.containerPath)
      insertAt(tx, containerPath, nodePos, newNode.id)
      tx.setSelection({
        type: 'property',
        path: newNode.getPath(),
        startOffset: 0,
        containerPath
      })
    } else {
      /* istanbul ignore else  */
      if (sel.isBefore() && direction === 'left') {
        if (nodePos > 0) {
          let previous = getPreviousNode(tx, containerPath, nodePos)
          if (previous.isText()) {
            tx.setSelection({
              type: 'property',
              path: previous.getPath(),
              startOffset: previous.getLength()
            })
            this.delete(tx, direction)
          } else {
            tx.setSelection({
              type: 'node',
              nodeId: previous.id,
              containerPath
            })
          }
        } else {
          // nothing to do
        }
      } else if (sel.isAfter() && direction === 'right') {
        let nodeIds = tx.get(containerPath)
        if (nodePos < nodeIds.length - 1) {
          let next = getNextNode(tx, containerPath, nodePos)
          if (next.isText()) {
            tx.setSelection({
              type: 'property',
              path: next.getPath(),
              startOffset: 0
            })
            this.delete(tx, direction)
          } else {
            tx.setSelection({
              type: 'node',
              nodeId: next.id,
              containerPath
            })
          }
        } else {
          // nothing to do
        }
      } else {
        console.warn('Unsupported case: delete(%s)', direction, sel)
      }
    }
  }

  _deletePropertySelection (tx, sel) {
    let path = sel.start.path
    let start = sel.start.offset
    let end = sel.end.offset
    tx.update(path, { type: 'delete', start: start, end: end })
    annotationHelpers.deletedText(tx, path, start, end)
  }

  // deletes all inner nodes and 'truncates' start and end node
  _deleteContainerSelection (tx, sel, options = {}) {
    let containerPath = sel.containerPath
    let start = sel.start
    let end = sel.end
    let startId = start.getNodeId()
    let endId = end.getNodeId()
    let startNode = tx.get(startId)
    let endNode = tx.get(endId)
    let startPos = startNode.getXpath().pos
    let endPos = endNode.getXpath().pos
    // special case: selection within one node
    if (startPos === endPos) {
      // ATTENTION: we need the root node here e.g. the list, not the list-item
      // OUCH: how we will we do it
      let node = getContainerRoot(tx, containerPath, startId)
      /* istanbul ignore else  */
      if (node.isText()) {
        deleteTextRange(tx, start, end)
      } else if (node.isList()) {
        deleteListRange(tx, node, start, end)
      } else {
        throw new Error('Not supported yet.')
      }
      tx.setSelection(sel.collapse('left'))
      return
    }

    // TODO: document the algorithm

    let firstNodeId = start.getNodeId()
    let lastNodeId = end.getNodeId()
    let firstNode = tx.get(start.getNodeId())
    let lastNode = tx.get(end.getNodeId())
    let firstEntirelySelected = isEntirelySelected(tx, firstNode, start, null)
    let lastEntirelySelected = isEntirelySelected(tx, lastNode, null, end)

    // delete or truncate last node
    if (lastEntirelySelected) {
      removeAt(tx, containerPath, endPos)
      deleteNode(tx, lastNode)
    } else {
      // ATTENTION: we need the root node here e.g. the list, not the list-item
      let node = getContainerRoot(tx, containerPath, lastNodeId)
      /* istanbul ignore else  */
      if (node.isText()) {
        deleteTextRange(tx, null, end)
      } else if (node.isList()) {
        deleteListRange(tx, node, null, end)
      } else {
        // IsolatedNodes can not be selected partially
      }
    }

    // delete inner nodes
    for (let i = endPos - 1; i > startPos; i--) {
      let nodeId = removeAt(tx, containerPath, i)
      deleteNode(tx, tx.get(nodeId))
    }

    // delete or truncate the first node
    if (firstEntirelySelected) {
      removeAt(tx, containerPath, startPos)
      deleteNode(tx, firstNode)
    } else {
      // ATTENTION: we need the root node here e.g. the list, not the list-item
      let node = getContainerRoot(tx, containerPath, firstNodeId)
      /* istanbul ignore else  */
      if (node.isText()) {
        deleteTextRange(tx, start, null)
      } else if (node.isList()) {
        deleteListRange(tx, node, start, null)
      } else {
        // IsolatedNodes can not be selected partially
      }
    }

    // insert a new TextNode if all has been deleted
    if (firstEntirelySelected && lastEntirelySelected) {
      // insert a new paragraph
      let textNode = this.createTextNode(tx, containerPath)
      insertAt(tx, containerPath, startPos, textNode.id)
      tx.setSelection({
        type: 'property',
        path: textNode.getPath(),
        startOffset: 0,
        containerPath: containerPath
      })
    } else if (!firstEntirelySelected && !lastEntirelySelected) {
      if (!options.noMerge) {
        this._merge(tx, firstNode, sel.start, 'right', containerPath)
      }
      tx.setSelection(sel.collapse('left'))
    } else if (firstEntirelySelected) {
      setCursor(tx, lastNode, containerPath, 'before')
    } else {
      setCursor(tx, firstNode, containerPath, 'after')
    }
  }

  insertInlineNode (tx, nodeData) {
    let sel = tx.selection
    let text = '\uFEFF'
    this.insertText(tx, text)
    sel = tx.selection
    let endOffset = tx.selection.end.offset
    let startOffset = endOffset - text.length
    nodeData = Object.assign({}, nodeData, {
      start: {
        path: sel.path,
        offset: startOffset
      },
      end: {
        path: sel.path,
        offset: endOffset
      }
    })
    return tx.create(nodeData)
  }

  insertBlockNode (tx, nodeData) {
    let sel = tx.selection
    let containerPath = sel.containerPath
    // don't create the node if it already exists
    let blockNode
    if (!nodeData._isNode || !tx.get(nodeData.id)) {
      blockNode = tx.create(nodeData)
    } else {
      blockNode = tx.get(nodeData.id)
    }
    /* istanbul ignore else  */
    if (sel.isNodeSelection()) {
      let nodeId = sel.getNodeId()
      let nodePos = getContainerPosition(tx, nodeId)
      // insert before
      if (sel.isBefore()) {
        insertAt(tx, containerPath, nodePos, blockNode.id)
      // insert after
      } else if (sel.isAfter()) {
        insertAt(tx, containerPath, nodePos + 1, blockNode.id)
        tx.setSelection({
          type: 'node',
          containerPath,
          nodeId: blockNode.id,
          mode: 'after'
        })
      } else {
        removeAt(tx, containerPath, nodePos)
        deleteNode(tx, tx.get(nodeId))
        insertAt(tx, containerPath, nodePos, blockNode.id)
        tx.setSelection({
          type: 'node',
          containerPath,
          nodeId: blockNode.id,
          mode: 'after'
        })
      }
    } else if (sel.isPropertySelection()) {
      /* istanbul ignore next */
      if (!containerPath) throw new Error('insertBlockNode can only be used within a container.')
      if (!sel.isCollapsed()) {
        this._deletePropertySelection(tx, sel)
        tx.setSelection(sel.collapse('left'))
      }
      let node = tx.get(sel.path[0])
      /* istanbul ignore next */
      if (!node) throw new Error('Invalid selection.')
      let nodePos = getContainerPosition(tx, node.id)
      /* istanbul ignore else  */
      if (node.isText()) {
        let text = node.getText()
        // replace node
        if (text.length === 0) {
          removeAt(tx, containerPath, nodePos)
          deleteNode(tx, node)
          insertAt(tx, containerPath, nodePos, blockNode.id)
          setCursor(tx, blockNode, containerPath, 'after')
        // insert before
        } else if (sel.start.offset === 0) {
          insertAt(tx, containerPath, nodePos, blockNode.id)
        // insert after
        } else if (sel.start.offset === text.length) {
          insertAt(tx, containerPath, nodePos + 1, blockNode.id)
          setCursor(tx, blockNode, containerPath, 'before')
        // break
        } else {
          this.break(tx)
          insertAt(tx, containerPath, nodePos + 1, blockNode.id)
          setCursor(tx, blockNode, containerPath, 'after')
        }
      } else {
        console.error('Not supported: insertBlockNode() on a custom node')
      }
    } else if (sel.isContainerSelection()) {
      if (sel.isCollapsed()) {
        let start = sel.start
        /* istanbul ignore else  */
        if (start.isPropertyCoordinate()) {
          tx.setSelection({
            type: 'property',
            path: start.path,
            startOffset: start.offset,
            containerPath
          })
        } else if (start.isNodeCoordinate()) {
          tx.setSelection({
            type: 'node',
            containerPath,
            nodeId: start.path[0],
            mode: start.offset === 0 ? 'before' : 'after'
          })
        } else {
          throw new Error('Unsupported selection for insertBlockNode')
        }
        return this.insertBlockNode(tx, blockNode)
      } else {
        this.break(tx)
        return this.insertBlockNode(tx, blockNode)
      }
    }
    return blockNode
  }

  insertText (tx, text) {
    let sel = tx.selection
    // type over a selected node or insert a paragraph before
    // or after
    /* istanbul ignore else  */
    if (sel.isNodeSelection()) {
      let containerPath = sel.containerPath
      let nodeId = sel.getNodeId()
      let nodePos = getContainerPosition(tx, nodeId)
      let textNode = this.createTextNode(tx, containerPath, text)
      if (sel.isBefore()) {
        insertAt(tx, containerPath, nodePos, textNode.id)
      } else if (sel.isAfter()) {
        insertAt(tx, containerPath, nodePos + 1, textNode.id)
      } else {
        removeAt(tx, containerPath, nodePos)
        deleteNode(tx, tx.get(nodeId))
        insertAt(tx, containerPath, nodePos, textNode.id)
      }
      setCursor(tx, textNode, containerPath, 'after')
    } else if (sel.isCustomSelection()) {
      // TODO: what to do with custom selections?
    } else if (sel.isCollapsed() || sel.isPropertySelection()) {
      // console.log('#### before', sel.toString())
      this._insertText(tx, sel, text)
      // console.log('### setting selection after typing: ', tx.selection.toString())
    } else if (sel.isContainerSelection()) {
      this._deleteContainerSelection(tx, sel)
      this.insertText(tx, text)
    }
  }

  paste (tx, content) {
    if (!content) return
    /* istanbul ignore else  */
    if (isString(content)) {
      paste(tx, {text: content})
    } else if (content._isDocument) {
      paste(tx, {doc: content})
    } else {
      throw new Error('Illegal content for paste.')
    }
  }

  /**
   * Switch text type for a given node. E.g. from `paragraph` to `heading`.
   *
   * @param {Object} args object with `selection`, `containerPath` and `data` with new node data
   * @return {Object} object with updated `selection`
   *
   * @example
   *
   * ```js
   * switchTextType(tx, {
   *   selection: bodyEditor.getSelection(),
   *  containerPath: bodyEditor.getContainerPath(),
   *   data: {
   *     type: 'heading',
   *     level: 2
   *  }
   * })
   * ```
   */
  switchTextType (tx, data) {
    let sel = tx.selection
    /* istanbul ignore next */
    if (!sel.isPropertySelection()) {
      throw new Error('Selection must be a PropertySelection.')
    }
    let containerPath = sel.containerPath
    /* istanbul ignore next */
    if (!containerPath) {
      throw new Error('Selection must be within a container.')
    }
    let path = sel.path
    let nodeId = path[0]
    let node = tx.get(nodeId)
    /* istanbul ignore next */
    if (!(node.isInstanceOf('text'))) {
      throw new Error('Trying to use switchTextType on a non text node.')
    }
    const newId = uuid(data.type)
    // Note: a TextNode is allowed to have its own way to store the plain-text
    const oldPath = node.getPath()
    console.assert(oldPath.length === 2, 'Currently we assume that TextNodes store the plain-text on the first level')
    const textProp = oldPath[1]
    let newPath = [newId, textProp]
    // create a new node and transfer annotations
    let newNodeData = Object.assign({
      id: newId,
      type: data.type,
      direction: node.direction
    }, data)
    newNodeData[textProp] = node.getText()

    let newNode = tx.create(newNodeData)
    annotationHelpers.transferAnnotations(tx, path, 0, newPath, 0)

    // hide and delete the old one, show the new node
    let pos = getContainerPosition(tx, nodeId)
    removeAt(tx, containerPath, pos)
    deleteNode(tx, node)
    insertAt(tx, containerPath, pos, newNode.id)

    tx.setSelection({
      type: 'property',
      path: newPath,
      startOffset: sel.start.offset,
      endOffset: sel.end.offset,
      containerPath
    })

    return newNode
  }

  toggleList (tx, params) {
    let sel = tx.selection
    let containerPath = sel.containerPath
    /* istanbul ignore next */
    if (!containerPath) {
      throw new Error('Selection must be within a container.')
    }
    if (sel.isPropertySelection()) {
      let nodeId = sel.start.path[0]
      // ATTENTION: we need the root node here e.g. the list, not the list-item
      let node = getContainerRoot(tx, containerPath, nodeId)
      let nodePos = node.getXpath().pos
      /* istanbul ignore else  */
      if (node.isText()) {
        removeAt(tx, containerPath, nodePos)
        let newList = this.createListNode(tx, containerPath, params)
        let newItem = newList.createListItem(node.getText())
        annotationHelpers.transferAnnotations(tx, node.getPath(), 0, newItem.getPath(), 0)
        newList.appendItem(newItem)
        deleteNode(tx, node)
        insertAt(tx, containerPath, nodePos, newList.id)
        tx.setSelection({
          type: 'property',
          path: newItem.getPath(),
          startOffset: sel.start.offset,
          containerPath
        })
      } else if (node.isList()) {
        let itemId = sel.start.path[0]
        let item = tx.get(itemId)
        let itemPos = node.getItemPosition(item)
        let newTextNode = this.createTextNode(tx, containerPath, item.getText())
        annotationHelpers.transferAnnotations(tx, item.getPath(), 0, newTextNode.getPath(), 0)
        // take the item out of the list
        node.removeItemAt(itemPos)
        if (node.isEmpty()) {
          removeAt(tx, containerPath, nodePos)
          deleteNode(tx, node)
          insertAt(tx, containerPath, nodePos, newTextNode.id)
        } else if (itemPos === 0) {
          insertAt(tx, containerPath, nodePos, newTextNode.id)
        } else if (node.getLength() <= itemPos) {
          insertAt(tx, containerPath, nodePos + 1, newTextNode.id)
        } else {
          // split the
          let tail = []
          const items = node.getItems()
          const L = items.length
          for (let i = L - 1; i >= itemPos; i--) {
            tail.unshift(items[i])
            node.removeItemAt(i)
          }
          let newList = this.createListNode(tx, containerPath, node)
          for (let i = 0; i < tail.length; i++) {
            newList.appendItem(tail[i])
          }
          insertAt(tx, containerPath, nodePos + 1, newTextNode.id)
          insertAt(tx, containerPath, nodePos + 2, newList.id)
        }
        tx.setSelection({
          type: 'property',
          path: newTextNode.getPath(),
          startOffset: sel.start.offset,
          containerPath
        })
      } else {
        // unsupported node type
      }
    } else if (sel.isContainerSelection()) {
      console.error('TODO: support toggleList with ContainerSelection')
    }
  }

  indent (tx) {
    let sel = tx.selection
    let containerPath = sel.containerPath
    if (sel.isPropertySelection()) {
      let nodeId = sel.start.getNodeId()
      // ATTENTION: we need the root node here, e.g. the list, not the list items
      let node = getContainerRoot(tx, containerPath, nodeId)
      if (node.isList()) {
        let itemId = sel.start.path[0]
        let item = tx.get(itemId)
        let level = item.getLevel()
        // Note: allowing only 3 levels
        if (item && level < 3) {
          item.setLevel(item.level + 1)
          // a pseudo change to let the list know that something has changed
          tx.set([node.id, '_itemsChanged'], true)
        }
      }
    } else if (sel.isContainerSelection()) {
      console.error('TODO: support toggleList with ContainerSelection')
    }
  }

  dedent (tx) {
    let sel = tx.selection
    let containerPath = sel.containerPath
    if (sel.isPropertySelection()) {
      let nodeId = sel.start.getNodeId()
      // ATTENTION: we need the root node here, e.g. the list, not the list items
      let node = getContainerRoot(tx, containerPath, nodeId)
      if (node.isList()) {
        let itemId = sel.start.path[0]
        let item = tx.get(itemId)
        let level = item.getLevel()
        if (item) {
          if (level > 1) {
            item.setLevel(item.level - 1)
            // a pseudo change to let the list know that something has changed
            tx.set([node.id, '_itemsChanged'], true)
          }
          // TODO: we could toggle the list item to paragraph
          // if dedenting on the first level
          //  else {
          //   return this.toggleList(tx)
          // }
        }
      }
    } else if (sel.isContainerSelection()) {
      console.error('TODO: support toggleList with ContainerSelection')
    }
  }

  /*
    <-->: anno
    |--|: area of change
    I: <--> |--|     :   nothing
    II: |--| <-->    :   move both by total span+L
    III: |-<-->-|    :   delete anno
    IV: |-<-|->      :   move start by diff to start+L, and end by total span+L
    V: <-|->-|       :   move end by diff to start+L
    VI: <-->|--|     :   noting if !anno.autoExpandRight
    VII: <-|--|->    :   move end by total span+L
  */
  _insertText (tx, sel, text) {
    let start = sel.start
    let end = sel.end
    /* istanbul ignore next  */
    if (!isArrayEqual(start.path, end.path)) {
      throw new Error('Unsupported state: range should be on one property')
    }
    let path = start.path
    let startOffset = start.offset
    let endOffset = end.offset
    let typeover = !sel.isCollapsed()
    let L = text.length
    // delete selected text
    if (typeover) {
      tx.update(path, { type: 'delete', start: startOffset, end: endOffset })
    }
    // insert new text
    tx.update(path, { type: 'insert', start: startOffset, text: text })
    // update annotations
    let annos = tx.getAnnotations(path)
    annos.forEach(function (anno) {
      let annoStart = anno.start.offset
      let annoEnd = anno.end.offset

      /* istanbul ignore else  */
      // I anno is before
      if (annoEnd < startOffset) {

      // II anno is after
      } else if (annoStart >= endOffset) {
        tx.update([anno.id, 'start'], { type: 'shift', value: startOffset - endOffset + L })
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset - endOffset + L })
      // III anno is deleted
      // NOTE: InlineNodes only have a length of one character
      // so they are always 'covered', and as they can not expand
      // they are deleted
      } else if (
        (annoStart >= startOffset && annoEnd < endOffset) ||
        (anno.isInlineNode() && annoStart >= startOffset && annoEnd <= endOffset)
      ) {
        tx.delete(anno.id)
      // IV anno.start between and anno.end after
      } else if (annoStart >= startOffset && annoEnd >= endOffset) {
        // do not move start if typing over
        if (annoStart > startOffset || !typeover) {
          tx.update([anno.id, 'start'], { type: 'shift', value: startOffset - annoStart + L })
        }
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset - endOffset + L })
      // V anno.start before and anno.end between
      } else if (annoStart < startOffset && annoEnd < endOffset) {
        // NOTE: here the anno gets expanded (that's the common way)
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset - annoEnd + L })
      // VI
      } else if (annoEnd === startOffset && !anno.constructor.autoExpandRight) {
        // skip
      // VII anno.start before and anno.end after
      } else if (annoStart < startOffset && annoEnd >= endOffset) {
        if (anno.isInlineNode()) {
          // skip
        } else {
          tx.update([anno.id, 'end'], { type: 'shift', value: startOffset - endOffset + L })
        }
      } else {
        console.warn('TODO: handle annotation update case.')
      }
    })
    let offset = startOffset + text.length
    tx.setSelection({
      type: 'property',
      path: start.path,
      startOffset: offset,
      containerPath: sel.containerPath,
      surfaceId: sel.surfaceId
    })
  }

  _breakNode (tx, node, coor, containerPath) {
    // ATTENTION: we need the root here, e.g. a list, not the list-item
    node = getContainerRoot(tx, containerPath, node.id)
    /* istanbul ignore else  */
    if (node.isText()) {
      this._breakTextNode(tx, node, coor, containerPath)
    } else if (node.isList()) {
      this._breakListNode(tx, node, coor, containerPath)
    } else {
      console.error('FIXME: _breakNode() not supported for type', node.type)
    }
  }

  _breakTextNode (tx, node, coor, containerPath) {
    let path = coor.path
    let offset = coor.offset
    let nodePos = node.getXpath().pos
    let text = node.getText()

    // when breaking at the first position, a new node of the same
    // type will be inserted.
    if (offset === 0) {
      let newNode = tx.create({
        type: node.type,
        content: ''
      })
      // show the new node
      insertAt(tx, containerPath, nodePos, newNode.id)
      tx.setSelection({
        type: 'property',
        path: path,
        startOffset: 0,
        containerPath
      })
    // otherwise split the text property and create a new paragraph node with trailing text and annotations transferred
    } else {
      const textPath = node.getPath()
      const textProp = textPath[1]
      const newId = uuid(node.type)
      let newNodeData = node.toJSON()
      newNodeData.id = newId
      newNodeData[textProp] = text.substring(offset)
      // if at the end insert a default text node no matter in which text node we are
      if (offset === text.length) {
        newNodeData.type = tx.getSchema().getDefaultTextType()
      }
      let newNode = tx.create(newNodeData)
      // Now we need to transfer annotations
      if (offset < text.length) {
        // transfer annotations which are after offset to the new node
        annotationHelpers.transferAnnotations(tx, path, offset, newNode.getPath(), 0)
        // truncate the original property
        tx.update(path, { type: 'delete', start: offset, end: text.length })
      }
      // show the new node
      insertAt(tx, containerPath, nodePos + 1, newNode.id)
      // update the selection
      tx.setSelection({
        type: 'property',
        path: newNode.getPath(),
        startOffset: 0,
        containerPath
      })
    }
  }

  _breakListNode (tx, node, coor, containerPath) {
    let path = coor.path
    let offset = coor.offset
    let listItem = tx.get(path[0])

    let L = node.length
    let itemPos = node.getItemPosition(listItem)
    let text = listItem.getText()
    let textProp = listItem.getPath()[1]
    let newItemData = listItem.toJSON()
    delete newItemData.id
    if (offset === 0) {
      // if breaking at an empty list item, then the list is split into two
      if (!text) {
        // if it is the first or last item, a default text node is inserted before or after, and the item is removed
        // if the list has only one element, it is removed
        let nodePos = node.getXpath().pos
        let newTextNode = this.createTextNode(tx, containerPath)
        // if the list is empty, replace it with a paragraph
        if (L < 2) {
          removeAt(tx, containerPath, nodePos)
          deleteNode(tx, node)
          insertAt(tx, containerPath, nodePos, newTextNode.id)
        // if at the first list item, remove the item
        } else if (itemPos === 0) {
          node.removeItem(listItem)
          deleteNode(tx, listItem)
          insertAt(tx, containerPath, nodePos, newTextNode.id)
        // if at the last list item, remove the item and append the paragraph
        } else if (itemPos >= L - 1) {
          node.removeItem(listItem)
          deleteNode(tx, listItem)
          insertAt(tx, containerPath, nodePos + 1, newTextNode.id)
        // otherwise create a new list
        } else {
          let tail = []
          const items = node.getItems().slice()
          for (let i = L - 1; i > itemPos; i--) {
            tail.unshift(items[i])
            node.removeItem(items[i])
          }
          node.removeItem(items[itemPos])
          let newList = this.createListNode(tx, containerPath, node)
          for (let i = 0; i < tail.length; i++) {
            newList.appendItem(tail[i])
          }
          insertAt(tx, containerPath, nodePos + 1, newTextNode.id)
          insertAt(tx, containerPath, nodePos + 2, newList.id)
        }
        tx.setSelection({
          type: 'property',
          path: newTextNode.getPath(),
          startOffset: 0
        })
      // insert a new paragraph above the current one
      } else {
        newItemData[textProp] = ''
        let newItem = tx.create(newItemData)
        node.insertItemAt(itemPos, newItem)
        tx.setSelection({
          type: 'property',
          path: listItem.getPath(),
          startOffset: 0
        })
      }
    // otherwise split the text property and create a new paragraph node with trailing text and annotations transferred
    } else {
      newItemData[textProp] = text.substring(offset)
      let newItem = tx.create(newItemData)
      // Now we need to transfer annotations
      if (offset < text.length) {
        // transfer annotations which are after offset to the new node
        annotationHelpers.transferAnnotations(tx, path, offset, newItem.getPath(), 0)
        // truncate the original property
        tx.update(path, { type: 'delete', start: offset, end: text.length })
      }
      node.insertItemAt(itemPos + 1, newItem)
      tx.setSelection({
        type: 'property',
        path: newItem.getPath(),
        startOffset: 0
      })
    }
  }

  _merge (tx, node, coor, direction, containerPath) {
    // detect cases where list items get merged
    // within a single list node
    if (node.isList()) {
      let list = node
      let itemId = coor.path[0]
      let item = tx.get(itemId)
      let itemPos = list.getItemPosition(item)
      let withinListNode = (
        (direction === 'left' && itemPos > 0) ||
        (direction === 'right' && itemPos < list.items.length - 1)
      )
      if (withinListNode) {
        itemPos = (direction === 'left') ? itemPos - 1 : itemPos
        let target = list.getItemAt(itemPos)
        let targetLength = target.getLength()
        mergeListItems(tx, list.id, itemPos)
        tx.setSelection({
          type: 'property',
          path: target.getPath(),
          startOffset: targetLength,
          containerPath
        })
        return
      }
    }
    // in all other cases merge is done across node boundaries
    let nodePos = getContainerPosition(tx, node.id)
    let nodeIds = tx.get(containerPath)
    if (direction === 'left' && nodePos > 0) {
      this._mergeNodes(tx, containerPath, nodePos - 1, direction)
    } else if (direction === 'right' && nodePos < nodeIds.length - 1) {
      this._mergeNodes(tx, containerPath, nodePos, direction)
    }
  }

  _mergeNodes (tx, containerPath, pos, direction) {
    let nodeIds = tx.get(containerPath)
    let first = tx.get(nodeIds[pos])
    let secondPos = pos + 1
    let second = tx.get(nodeIds[secondPos])
    if (first.isText()) {
      // Simplification for empty nodes
      if (first.isEmpty()) {
        removeAt(tx, containerPath, pos)
        secondPos--
        deleteNode(tx, first)
        // TODO: need to clear where to handle
        // selections ... probably better not to do it here
        setCursor(tx, second, containerPath, 'before')
        return
      }
      let target = first
      let targetPath = target.getPath()
      let targetLength = target.getLength()
      if (second.isText()) {
        let source = second
        let sourcePath = source.getPath()
        removeAt(tx, containerPath, secondPos)
        // append the text
        tx.update(targetPath, { type: 'insert', start: targetLength, text: source.getText() })
        // transfer annotations
        annotationHelpers.transferAnnotations(tx, sourcePath, 0, targetPath, targetLength)
        deleteNode(tx, source)
        tx.setSelection({
          type: 'property',
          path: targetPath,
          startOffset: targetLength,
          containerPath
        })
      } else if (second.isList()) {
        let list = second
        if (!second.isEmpty()) {
          let source = list.getFirstItem()
          let sourcePath = source.getPath()
          // remove merged item from list
          list.removeItemAt(0)
          // append the text
          tx.update(targetPath, { type: 'insert', start: targetLength, text: source.getText() })
          // transfer annotations
          annotationHelpers.transferAnnotations(tx, sourcePath, 0, targetPath, targetLength)
          // delete item and prune empty list
          deleteNode(tx, source)
        }
        if (list.isEmpty()) {
          removeAt(tx, containerPath, secondPos)
          deleteNode(tx, list)
        }
        tx.setSelection({
          type: 'property',
          path: targetPath,
          startOffset: targetLength,
          containerPath
        })
      } else {
        selectNode(tx, direction === 'left' ? first.id : second.id, containerPath)
      }
    } else if (first.isList()) {
      if (second.isText()) {
        let target = first.getLastItem()
        let targetPath = target.getPath()
        let targetLength = target.getLength()
        let nodeIds = tx.get(containerPath)
        let third = (nodeIds.length > pos + 2) ? tx.get(nodeIds[pos + 2]) : null
        if (second.getLength() === 0) {
          removeAt(tx, containerPath, secondPos)
          deleteNode(tx, second)
        } else {
          let source = second
          let sourcePath = source.getPath()
          removeAt(tx, containerPath, secondPos)
          tx.update(targetPath, { type: 'insert', start: targetLength, text: source.getText() })
          annotationHelpers.transferAnnotations(tx, sourcePath, 0, targetPath, targetLength)
          deleteNode(tx, source)
        }
        // merge to lists if they were split by a paragraph
        if (third && third.type === first.type) {
          this._mergeTwoLists(tx, containerPath, first, third)
        }
        tx.setSelection({
          type: 'property',
          path: target.getPath(),
          startOffset: targetLength,
          containerPath
        })
      } else if (second.isList()) {
        /* istanbul ignore next */
        if (direction !== 'right') {
          // ATTENTION: merging two lists by using BACKSPACE is not possible,
          // as BACKSPACE will first turn the list into a paragraph
          throw new Error('Illegal state')
        }
        let item = first.getLastItem()
        this._mergeTwoLists(tx, containerPath, first, second)
        tx.setSelection({
          type: 'property',
          path: item.getPath(),
          startOffset: item.getLength(),
          containerPath
        })
      } else {
        selectNode(tx, direction === 'left' ? first.id : second.id, containerPath)
      }
    } else {
      if (second.isText() && second.isEmpty()) {
        removeAt(tx, containerPath, secondPos)
        deleteNode(tx, second)
        setCursor(tx, first, containerPath, 'after')
      } else {
        selectNode(tx, direction === 'left' ? first.id : second.id, containerPath)
      }
    }
  }

  _mergeTwoLists (tx, containerPath, first, second) {
    let secondPos = getContainerPosition(tx, second)
    removeAt(tx, containerPath, secondPos)
    let secondItems = second.getItems().slice()
    for (let i = 0; i < secondItems.length; i++) {
      second.removeItemAt(0)
      first.appendItem(secondItems[i])
    }
    deleteNode(tx, second)
  }
}
