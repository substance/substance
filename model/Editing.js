import isArrayEqual from '../util/isArrayEqual'
import isString from '../util/isString'
import last from '../util/last'
import uuid from '../util/uuid'
import annotationHelpers from '../model/annotationHelpers'
import documentHelpers from '../model/documentHelpers'
import { setCursor, isEntirelySelected, selectNode } from '../model/selectionHelpers'
import paste from '../model/paste'

/**
  Core editing implementation, that controls meta behavior
  such as deleting a selection, merging nodes, etc.

  Some of the implementation are then delegated to specific editing behaviors,
  such as manipulating content of a text-property, merging or breaking text nodes

  Note: this is pretty much the same what we did with transforms before.
        We decided to move this here, to switch to a stateful editor implementation (aka turtle-graphics-style)
 */
class Editing {

  // create an annotation for the current selection using the given data
  annotate(tx, annotation) {
    let sel = tx.selection
    if (!sel || sel.isNull() || sel.isCollapsed()) {
      throw new Error('Non-collapsed selection required for tx.annotate()')
    }
    if (sel.isCollapsed()) return
    let schema = tx.getSchema()
    let AnnotationClass = schema.getNodeClass(annotation.type)
    if (!AnnotationClass) throw new Error('Unknown annotation type', annotation)
    if (sel.isNodeSelection()) {
      throw new Error('Node selections are not supported by tx.annotate()')
    } else if (sel.isCustomSelection()) {
      throw new Error('Custom selections are not supported by tx.annotate()')
    }
    let start = sel.start
    let end = sel.end
    let containerId = sel.containerId
    let nodeData = { start, end, containerId }
    if (sel.isPropertySelection()) {
      if (!AnnotationClass.prototype._isAnnotation) {
        throw new Error('Annotation can not be created for a selection.')
      }
    } else if (sel.isContainerSelection()) {
      if (AnnotationClass.prototype._isPropertyAnnotation) {
        console.warn('NOT SUPPORTED YET: creating property annotations for a non collapsed container selection.')
      }
    } else {
      throw new Error('Unsupported selection.')
    }
    Object.assign(nodeData, annotation)
    return tx.create(nodeData)
  }

  break(tx) {
    let sel = tx.selection
    if (sel.isNodeSelection()) {
      let containerId = sel.containerId
      let container = tx.get(containerId)
      let nodeId = sel.getNodeId()
      let nodePos = container.getPosition(nodeId, 'strict')
      let textNode = tx.createDefaultTextNode()
      if (sel.isBefore()) {
        tx.update(container.getContentPath(), { type: 'insert', pos: nodePos, value: textNode.id })
        // leave selection as is
      } else {
        tx.update(container.getContentPath(), { type: 'insert', pos: nodePos+1, value: textNode.id })
        setCursor(tx, textNode, containerId, 'before')
      }
    }
    else if (sel.isCustomSelection()) {
      // TODO: what to do with custom selections?
    }
    else if (sel.isCollapsed() || sel.isPropertySelection()) {
      let containerId = sel.containerId
      if (!sel.isCollapsed()) {
        // delete the selection
        this.deletePropertySelection(tx, sel)
        tx.setSelection(sel.collapse('left'))
      }
      // then break the node
      if (containerId) {
        let container = tx.get(containerId)
        let nodeId = sel.start.path[0]
        let node = tx.get(nodeId)
        this._breakNode(tx, node, sel.start, container)
      } else {
        this.insertText(tx, '\n')
      }
    }
    else if (sel.isContainerSelection()) {
      if (sel.start.hasSamePath(sel.end)) {
        this.deleteContainerSelection(tx, sel)
        this.break(tx)
      } else {
        let start = sel.start
        let containerId = sel.containerId
        let container = tx.get(containerId)
        let startNodeId = start.path[0]
        let nodePos = container.getPosition(startNodeId, 'strict')
        this.deleteContainerSelection(tx, sel)
        if (nodePos < container.length-1) {
          setCursor(tx, container.getNodeAt(nodePos+1), containerId, 'before')
        } else {
          tx.setSelection(sel.collapse('left'))
          this.break(tx)
        }
      }
    }
  }

  delete(tx, direction) {
    let sel = tx.selection
    // special implementation for node selections:
    // either delete the node (replacing with an empty text node)
    // or just move the cursor
    if (sel.isNodeSelection()) {
      this.deleteNodeSelection(tx, sel, direction)
    }
    // TODO: what to do with custom selections?
    else if (sel.isCustomSelection()) {}
    // if the selection is collapsed this is the classical one-character deletion
    // either backwards (backspace) or forward (delete)
    else if (sel.isCollapsed()) {
      // Deletion of a single character leads to a merge
      // if cursor is at a text boundary (TextNode, ListItem)
      // and direction is towards that boundary
      let path = sel.start.path
      let node = tx.get(path[0])
      let text = tx.get(path)
      let offset = sel.start.offset
      let needsMerge = (sel.containerId && (
        (offset === 0 && direction === 'left') ||
        (offset === text.length && direction === 'right')
      ))
      if (needsMerge) {
        // ATTENTION: deviation from standard implementation
        // for list items: Word and GDoc toggle a list item
        // when doing a BACKSPACE at the first position
        let root = node.getRoot()
        if (root.isList() && offset === 0 && direction === 'left') {
          return this.toggleList(tx)
        } else {
          let container = tx.get(sel.containerId)
          this._merge(tx, root, sel.start, direction, container)
        }
      } else {
        let startOffset = (direction === 'left') ? offset-1 : offset
        let endOffset = startOffset+1
        let start = { path: path, offset: startOffset }
        let end = { path: path, offset: endOffset }
        documentHelpers.deleteTextRange(tx, start, end)
        tx.setSelection({
          type: 'property',
          path: path,
          startOffset: startOffset,
          containerId: sel.containerId
        })
      }
    }
    // deleting a range of characters within a text property
    else if (sel.isPropertySelection()) {
      documentHelpers.deleteTextRange(tx, sel.start, sel.end)
      tx.setSelection(sel.collapse('left'))
    }
    // deleting a range within a container (across multiple nodes)
    else if (sel.isContainerSelection()) {
      this.deleteContainerSelection(tx, sel)
    }
    else {
      console.warn('Unsupported case: tx.delete(%)', direction, sel)
    }
  }

  deleteNodeSelection(tx, sel, direction) {
    let nodeId = sel.getNodeId()
    let container = tx.get(sel.containerId)
    let nodePos = container.getPosition(nodeId, 'strict')
    if (sel.isFull() ||
        sel.isBefore() && direction === 'right' ||
        sel.isAfter() && direction === 'left' ) {
      // replace the node with default text node
      let contentPath = container.getContentPath()
      tx.update(contentPath, { type: 'delete', pos: nodePos })
      tx.delete(nodeId)
      let newNode = tx.createDefaultTextNode()
      tx.update(contentPath, { type: 'insert', pos: nodePos, value: newNode.id })
      tx.setSelection({
        type: 'property',
        path: newNode.getTextPath(),
        startOffset: 0,
        containerId: container.id,
      })
    } else {
      if (sel.isBefore() && direction === 'left') {
        if (nodePos > 0) {
          let previous = container.getNodeAt(nodePos-1)
          if (previous.isText()) {
            tx.setSelection({
              type: 'property',
              path: previous.getTextPath(),
              startOffset: previous.getLength()
            })
            this.delete(tx, direction)
          } else {
            tx.setSelection({
              type: 'node',
              nodeId: previous.id,
              containerId: container.id
            })
          }
        } else {
          // nothing to do
        }
      } else if (sel.isAfter() && direction === 'right') {
        if (nodePos < container.getLength()-1) {
          let next = container.getNodeAt(nodePos+1)
          if (next.isText()) {
            tx.setSelection({
              type: 'property',
              path: next.getTextPath(),
              startOffset: 0
            })
            this.delete(tx, direction)
          } else {
            tx.setSelection({
              type: 'node',
              nodeId: next.id,
              containerId: container.id
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

  deletePropertySelection(tx, sel) {
    let path = sel.start.path
    let start = sel.start.offset
    let end = sel.end.offset
    tx.update(path, { type: 'delete', start: start, end: end })
    annotationHelpers.deletedText(tx, path, start, end)
  }

  // deletes all inner nodes and 'truncates' start and end node
  deleteContainerSelection(tx, sel) {
    let containerId = sel.containerId
    let container = tx.get(containerId)
    let start = sel.start
    let end = sel.end
    let startId = start.getNodeId()
    let endId = end.getNodeId()
    let startPos = container.getPosition(startId, 'strict')
    let endPos = container.getPosition(endId, 'strict')

    // special case: selection within one node
    if (startPos === endPos) {
      // ATTENTION: we need the root node here e.g. the list, not the list-item
      let node = tx.get(startId).getRoot()
      if (node.isText()) {
        documentHelpers.deleteTextRange(tx, start, end)
      } else if (node.isList()) {
        documentHelpers.deleteListRange(tx, node, start, end)
      } else {
        throw new Error('Not supported yet.')
      }
      tx.setSelection(sel.collapse('left'))
      return
    }

    // normalize the range if it is 'reverse'
    if (startPos > endPos) {
      [start, end] = [end, start];
      [startPos, endPos] = [endPos, startPos];
      [startId, endId] = [endId, startId]
    }

    // TODO: document the algorithm

    let firstNode = tx.get(start.getNodeId())
    let lastNode = tx.get(end.getNodeId())
    let firstEntirelySelected = isEntirelySelected(tx, firstNode, start, null)
    let lastEntirelySelected = isEntirelySelected(tx, lastNode, null, end)

    // delete or truncate last node
    if (lastEntirelySelected) {
      tx.update([container.id, 'nodes'], { type: 'delete', pos: endPos })
      documentHelpers.deleteNode(tx, lastNode)
    } else {
      // ATTENTION: we need the root node here e.g. the list, not the list-item
      let node = lastNode.getRoot()
      if (node.isText()) {
        documentHelpers.deleteTextRange(tx, null, end)
      } else if (node.isList()) {
        documentHelpers.deleteListRange(tx, node, null, end)
      } else {
        // IsolatedNodes can not be selected partially
      }
    }

    // delete inner nodes
    for (let i = endPos-1; i > startPos; i--) {
      let nodeId = container.nodes[i]
      tx.update([container.id, 'nodes'], { type: 'delete', pos: i })
      documentHelpers.deleteNode(tx, tx.get(nodeId))
    }

    // delete or truncate the first node
    if (firstEntirelySelected) {
      tx.update([container.id, 'nodes'], { type: 'delete', pos: startPos })
      documentHelpers.deleteNode(tx, firstNode)
    } else {
      // ATTENTION: we need the root node here e.g. the list, not the list-item
      let node = firstNode.getRoot()
      if (node.isText()) {
        documentHelpers.deleteTextRange(tx, start, null)
      } else if (node.isList()) {
        documentHelpers.deleteListRange(tx, node, start, null)
      } else {
        // IsolatedNodes can not be selected partially
      }
    }

    // insert a new TextNode if all has been deleted
    if (firstEntirelySelected && lastEntirelySelected) {
      // insert a new paragraph
      let textNode = tx.createDefaultTextNode()
      tx.update([container.id, 'nodes'], { type: 'insert', pos: startPos, value: textNode.id })
      tx.setSelection({
        type: 'property',
        path: textNode.getTextPath(),
        startOffset: 0,
        containerId: containerId
      })
    } else if (!firstEntirelySelected && !lastEntirelySelected) {
      this._merge(tx, firstNode, sel.start, 'right', container)
      tx.setSelection(sel.collapse('left'))
    } else if (firstEntirelySelected) {
      setCursor(tx, lastNode, container.id, 'before')
    } else {
      setCursor(tx, firstNode, container.id, 'after')
    }
  }

  /*
    Delete a node and all annotations attached to it,
    and removes the node from the container.

    @param {String} nodeId
    @param {String} [containerId]
   */
  deleteNode(tx, nodeId, containerId) {
    if (!nodeId) throw new Error('Parameter `nodeId` is mandatory.')
    let node = tx.get(nodeId)
    if (!node) throw new Error('Node does not exist')
    if (containerId) {
      let container = tx.get(containerId)
      container.hide(nodeId)
      // TODO: fix support for container annotations
      // transfer anchors of ContainerAnnotations to previous or next node:
      //  - start anchors go to the next node
      //  - end anchors go to the previous node
      // let anchors = tx.getIndex('container-annotation-anchors').get(nodeId)
      // for (let i = 0; i < anchors.length; i++) {
      //   let anchor = anchors[i]
      //   container = tx.get(anchor.containerId)
      //   // Note: during the course of this loop we might have deleted the node already
      //   // so, don't do it again
      //   if (!tx.get(anchor.id)) continue
      //   let pos = container.getPosition(anchor.path[0])
      //   let path, offset
      //   if (anchor.isStart) {
      //     if (pos < container.getLength()-1) {
      //       let nextNode = container.getChildAt(pos+1)
      //       if (nextNode.isText()) {
      //         path = [nextNode.id, 'content']
      //       } else {
      //         path = [nextNode.id]
      //       }
      //       tx.set([anchor.id, 'start', 'path'], path)
      //       tx.set([anchor.id, 'start', 'offset'], 0)
      //     } else {
      //       tx.delete(anchor.id)
      //     }
      //   } else {
      //     if (pos > 0) {
      //       let previousNode = container.getChildAt(pos-1)
      //       if (previousNode.isText()) {
      //         path = [previousNode.id, 'content']
      //         offset = tx.get(path).length
      //       } else {
      //         path = [previousNode.id]
      //         offset = 1
      //       }
      //       tx.set([anchor.id, 'endPath'], path)
      //       tx.set([anchor.id, 'endOffset'], offset)
      //     } else {
      //       tx.delete(anchor.id)
      //     }
      //   }
      // }
    }
    documentHelpers.deleteNode(tx, node)
  }

  insertInlineNode(tx, nodeData) {
    let sel = tx.selection
    if (!sel.isPropertySelection()) throw new Error('insertInlineNode requires a PropertySelection')
    let text = "\uFEFF"
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

  insertBlockNode(tx, nodeData) {
    let sel = tx.selection
    if (!sel || sel.isNull()) throw new Error('Selection is null.')
    // don't create the node if it already exists
    let blockNode
    if (!nodeData._isNode || !tx.get(nodeData.id)) {
      blockNode = tx.create(nodeData)
    } else {
      blockNode = tx.get(nodeData.id)
    }
    if (sel.isNodeSelection()) {
      let containerId = sel.containerId
      let container = tx.get(containerId)
      let nodeId = sel.getNodeId()
      let nodePos = container.getPosition(nodeId, 'strict')
      // insert before
      if (sel.isBefore()) {
        tx.update(container.getContentPath(), { type: 'insert', pos: nodePos, value: blockNode.id })
      }
      // insert after
      else if (sel.isAfter()) {
        tx.update(container.getContentPath(), { type: 'insert', pos: nodePos+1, value: blockNode.id })
        tx.setSelection({
          type: 'node',
          containerId: containerId,
          nodeId: blockNode.id,
          mode: 'after'
        })
      } else {
        tx.update(container.getContentPath(), { type: 'delete', pos: nodePos })
        tx.delete(sel.getNodeId())
        tx.update([container.id, 'nodes'], { type: 'insert', pos: nodePos, value: blockNode.id })
        tx.setSelection({
          type: 'node',
          containerId: containerId,
          nodeId: blockNode.id,
          mode: 'after'
        })
      }
    } else if (sel.isPropertySelection()) {
      if (!sel.containerId) throw new Error('insertBlockNode can only be used within a container.')
      let container = tx.get(sel.containerId)
      if (!sel.isCollapsed()) {
        this.deletePropertySelection(tx)
        tx.setSelection(sel.collapse('left'))
      }
      let node = tx.get(sel.path[0])
      if (!node) throw new Error('Invalid selection.')
      let nodePos = container.getPosition(node.id, 'strict')
      if (node.isText()) {
        let text = node.getText()
        // replace node
        if (text.length === 0) {
          tx.update(container.getContentPath(), { type: 'delete', pos: nodePos })
          tx.delete(node.id)
          tx.update([container.id, 'nodes'], { type: 'insert', pos: nodePos, value: blockNode.id })
          setCursor(tx, blockNode, container.id, 'after')
        }
        // insert before
        else if (sel.start.offset === 0) {
          tx.update(container.getContentPath(), { type: 'insert', pos: nodePos, value: blockNode.id })
        }
        // insert after
        else if (sel.start.offset === text.length) {
          tx.update(container.getContentPath(), { type: 'insert', pos: nodePos+1, value: blockNode.id })
          setCursor(tx, blockNode, container.id, 'before')
        }
        // break
        else {
          this.break(tx)
          tx.update(container.getContentPath(), { type: 'insert', pos: nodePos+1, value: blockNode.id })
          setCursor(tx, blockNode, container.id, 'after')
        }
      } else {
        // TODO: this will be necessary for lists
        console.error('Not yet implemented: insertBlockNode() on a custom node')
      }
    } else if (sel.isContainerSelection()) {
      if (sel.isCollapsed()) {
        let start = sel.start
        if (start.isPropertyCoordinate()) {
          tx.setSelection({
            type: 'property',
            path: start.path,
            startOffset: start.offset,
            containerId: sel.containerId,
          })
        } else if (start.isNodeCoordinate()) {
          tx.setSelection({
            type: 'node',
            containerId: sel.containerId,
            nodeId: start.path[0],
            mode: start.offset === 0 ? 'before' : 'after',
          })
        } else {
          throw new Error('Unsupported selection for insertBlockNode')
        }
        return this.insertBlockNode(tx, blockNode)
      }
    }
  }

  insertText(tx, text) {
    let sel = tx.selection
    // type over a selected node or insert a paragraph before
    // or after
    if (sel.isNodeSelection()) {
      let containerId = sel.containerId
      let container = tx.get(containerId)
      let nodeId = sel.getNodeId()
      let nodePos = container.getPosition(nodeId, 'strict')
      let textNode = tx.createDefaultTextNode(text)
      if (sel.isBefore()) {
        container.show(textNode, nodePos)
      } else if (sel.isAfter()) {
        container.show(textNode, nodePos+1)
      } else {
        container.hide(nodeId)
        tx.delete(nodeId)
        container.show(textNode, nodePos)
      }
      setCursor(tx, textNode, sel.containerId, 'after')
    } else if (sel.isCustomSelection()) {
      // TODO: what to do with custom selections?
    } else if (sel.isCollapsed() || sel.isPropertySelection()) {
      // console.log('#### before', sel.toString())
      this._insertText(tx, sel, text)
      // console.log('### setting selection after typing: ', tx.selection.toString())
    } else if (sel.isContainerSelection()) {
      this.deleteContainerSelection(tx, sel)
      this.insertText(tx, text)
    }
  }

  paste(tx, content) {
    if (!content) return
    if (isString(content)) {
      paste(tx, {text: content})
    } else if (content._isDocument) {
      paste(tx, {doc: content})
    } else {
      throw new Error('Illegal content for paste.')
    }
  }

  /**
    Switch text type for a given node. E.g. from `paragraph` to `heading`.

    @param {Object} args object with `selection`, `containerId` and `data` with new node data
    @return {Object} object with updated `selection`

    @example

    ```js
    switchTextType(tx, {
      selection: bodyEditor.getSelection(),
      containerId: bodyEditor.getContainerId(),
      data: {
        type: 'heading',
        level: 2
      }
    })
    ```
  */
  switchTextType(tx, data) {
    let sel = tx.selection
    if (!sel.isPropertySelection()) {
      throw new Error("Selection must be a PropertySelection.")
    }
    let containerId = sel.containerId
    if (!containerId) {
      throw new Error("Selection must be within a container.")
    }
    let path = sel.path
    let nodeId = path[0]
    let node = tx.get(nodeId)
    if (!(node.isInstanceOf('text'))) {
      throw new Error('Trying to use switchTextType on a non text node. Skipping.')
    }
    // create a new node and transfer annotations
    let newNode = Object.assign({
      id: uuid(data.type),
      type: data.type,
      content: node.content,
      direction: node.direction
    }, data)
    let newPath = [newNode.id, 'content']
    newNode = tx.create(newNode)
    annotationHelpers.transferAnnotations(tx, path, 0, newPath, 0)

    // hide the old one, show the new node
    let container = tx.get(sel.containerId)
    let pos = container.getPosition(nodeId, 'strict')
    container.hide(nodeId)
    container.show(newNode.id, pos)

    // remove the old one from the document
    this.deleteNode(tx, node.id, containerId)
    tx.setSelection({
      type: 'property',
      path: newPath,
      startOffset: sel.start.offset,
      endOffset: sel.end.offset,
      containerId: containerId
    })

    return newNode
  }

  toggleList(tx, params) {
    let sel = tx.selection
    let container = tx.get(sel.containerId)
    // not possible without container
    if (!container) return
    if (sel.isPropertySelection()) {
      let nodeId = sel.start.path[0]
      // ATTENTION: we need the root node here e.g. the list, not the list-item
      let node = tx.get(nodeId).getRoot()
      let nodePos = container.getPosition(node.id, 'strict')
      if (node.isText()) {
        tx.update([container.id, 'nodes'], { type: 'delete', pos: nodePos })
        // TODO: what if this should create a different list-item type?
        let newItem = tx.create({
          type: 'list-item',
          content: node.getText(),
        })
        annotationHelpers.transferAnnotations(tx, node.getTextPath(), 0, newItem.getTextPath(), 0)
        let newList = tx.create(Object.assign({
          type: 'list',
          items: [newItem.id]
        }, params))
        tx.delete(node.id)
        tx.update([container.id, 'nodes'], { type: 'insert', pos: nodePos, value: newList.id })
        tx.setSelection({
          type: 'property',
          path: newItem.getTextPath(),
          startOffset: sel.start.offset,
          containerId: sel.containerId
        })
      } else if (node.isList()) {
        let itemId = sel.start.path[0]
        let itemPos = node.getItemPosition(itemId)
        let item = node.getItemAt(itemPos)
        let newTextNode = tx.createDefaultTextNode(item.getText())
        annotationHelpers.transferAnnotations(tx, item.getTextPath(), 0, newTextNode.getTextPath(), 0)
        // take the item out of the list
        node.removeItemAt(itemPos)
        if (node.getLength() === 0) {
          tx.update([container.id, 'nodes'], { type: 'delete', pos: nodePos })
          tx.delete(node.id)
          tx.update([container.id, 'nodes'], { type: 'insert', pos: nodePos, value: newTextNode.id })
        } else if (itemPos === 0) {
          tx.update([container.id, 'nodes'], { type: 'insert', pos: nodePos, value: newTextNode.id })
        } else if (node.getLength() <= itemPos){
          tx.update([container.id, 'nodes'], { type: 'insert', pos: nodePos+1, value: newTextNode.id })
        } else {
          //split the
          let tail = []
          const items = node.items.slice()
          const L = items.length
          for (let i = L-1; i >= itemPos; i--) {
            tail.unshift(items[i])
            node.removeItemAt(i)
          }
          let newList = tx.create({
            type: 'list',
            items: tail,
            ordered: node.ordered
          })
          tx.update([container.id, 'nodes'], { type: 'insert', pos: nodePos+1, value: newTextNode.id })
          tx.update([container.id, 'nodes'], { type: 'insert', pos: nodePos+2, value: newList.id })
        }
        tx.setSelection({
          type: 'property',
          path: newTextNode.getTextPath(),
          startOffset: sel.start.offset,
          containerId: sel.containerId
        })
      }
    } else if (sel.isContainerSelection()) {
      console.error('TODO: support toggleList with ContainerSelection')
    }
  }

  indent(tx) {
    let sel = tx.selection
    if (sel.isPropertySelection()) {
      let nodeId = sel.start.getNodeId()
      // ATTENTION: we need the root node here, e.g. the list, not the list items
      let node = tx.get(nodeId).getRoot()
      if (node.isList()) {
        let itemId = sel.start.path[0]
        let item = tx.get(itemId)
        // Note: allowing only 3 levels
        if (item && item.level<3) {
          tx.set([itemId, 'level'], item.level+1)
        }
      }
    } else if (sel.isContainerSelection()) {
      // TODO support ContainerSelection
    }
  }

  dedent(tx) {
    let sel = tx.selection
    if (sel.isPropertySelection()) {
      let nodeId = sel.start.getNodeId()
      // ATTENTION: we need the root node here, e.g. the list, not the list items
      let node = tx.get(nodeId).getRoot()
      if (node.isList()) {
        let itemId = sel.start.path[0]
        let item = tx.get(itemId)
        if (item && item.level>1) {
          tx.set([itemId, 'level'], item.level-1)
        }
      }
    } else if (sel.isContainerSelection()) {
      // TODO support ContainerSelection
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
    VI: <-|--|->     :   move end by total span+L
  */
  _insertText(tx, sel, text) {
    let start = sel.start
    let end = sel.end
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
    annos.forEach(function(anno) {
      let annoStart = anno.start.offset
      let annoEnd = anno.end.offset
      // I anno is before
      if (annoEnd<startOffset) {
        return
      }
      // II anno is after
      else if (annoStart>=endOffset) {
        tx.update([anno.id, 'start'], { type: 'shift', value: startOffset-endOffset+L })
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset+L })
      }
      // III anno is deleted
      // NOTE: InlineNodes only have a length of one character
      // so they are always 'covered', and as they can not expand
      // they are deleted
      else if (
        (annoStart>=startOffset && annoEnd<endOffset) ||
        (anno._isInlineNode && annoStart>=startOffset && annoEnd<=endOffset)
      ) {
        tx.delete(anno.id)
      }
      // IV anno.start between and anno.end after
      else if (annoStart>=startOffset && annoEnd>=endOffset) {
        // do not move start if typing over
        if (annoStart>startOffset || !typeover) {
          tx.update([anno.id, 'start'], { type: 'shift', value: startOffset-annoStart+L })
        }
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset+L })
      }
      // V anno.start before and anno.end between
      else if (annoStart<startOffset && annoEnd<endOffset) {
        // NOTE: here the anno gets expanded (that's the common way)
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-annoEnd+L })
      }
      // VI anno.start before and anno.end after
      else if (annoStart<startOffset && annoEnd>=endOffset) {
        if (anno._isInlineNode) {
          // skip
        } else {
          tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset+L })
        }
      }
      else {
        console.warn('TODO: handle annotation update case.')
      }
    })
    let offset = startOffset + text.length
    tx.setSelection({
      type: 'property',
      path: start.path,
      startOffset: offset,
      containerId: sel.containerId,
      surfaceId: sel.surfaceId
    })
  }

  _breakNode(tx, node, coor, container) {
    // ATTENTION: we need the root here, e.g. a list, not the list-item
    node = node.getRoot()
    if (node.isText()) {
      this._breakTextNode(tx, node, coor, container)
    } else if (node.isList()) {
      this._breakListNode(tx, node, coor, container)
    } else {
      throw new Error('Not supported')
    }
  }

  _breakTextNode(tx, node, coor, container) {
    let path = coor.path
    let offset = coor.offset
    let nodePos = container.getPosition(node.id, 'strict')
    let text = node.getText()

    // when breaking at the first position, a new node of the same
    // type will be inserted.
    if (offset === 0) {
      let newNode = tx.create({
        type: node.type,
        content: ""
      })
      // show the new node
      container.show(newNode.id, nodePos)
      tx.setSelection({
        type: 'property',
        path: path,
        startOffset: 0,
        containerId: container.id
      })
    }
    // otherwise split the text property and create a new paragraph node with trailing text and annotations transferred
    else {
      let newNode = node.toJSON()
      delete newNode.id
      newNode.content = text.substring(offset)
      // if at the end insert a default text node no matter in which text node we are
      if (offset === text.length) {
        newNode.type = tx.getSchema().getDefaultTextType()
      }
      newNode = tx.create(newNode)
      // Now we need to transfer annotations
      if (offset < text.length) {
        // transfer annotations which are after offset to the new node
        annotationHelpers.transferAnnotations(tx, path, offset, newNode.getTextPath(), 0)
        // truncate the original property
        tx.update(path, { type: 'delete', start: offset, end: text.length })
      }
      // show the new node
      container.show(newNode.id, nodePos+1)
      // update the selection
      tx.setSelection({
        type: 'property',
        path: newNode.getTextPath(),
        startOffset: 0,
        containerId: container.id
      })
    }
  }

  _breakListNode(tx, node, coor, container) {
    let path = coor.path
    let offset = coor.offset
    let listItem = tx.get(path[0])

    let L = node.length
    let itemPos = node.getItemPosition(listItem.id)
    let text = listItem.getText()
    let newItem = listItem.toJSON()
    delete newItem.id
    if (offset === 0) {
      // if breaking at an empty list item, then the list is split into two
      if (!text) {
        // if it is the first or last item, a default text node is inserted before or after, and the item is removed
        // if the list has only one element, it is removed
        let nodePos = container.getPosition(node.id, 'strict')
        let newTextNode = tx.createDefaultTextNode()
        // if the list is empty, replace it with a paragraph
        if (L < 2) {
          container.hide(node.id)
          tx.delete(node.id)
          container.show(newTextNode.id, nodePos)
        }
        // if at the first list item, remove the item
        else if (itemPos === 0) {
          node.remove(listItem.id)
          tx.delete(listItem.id)
          container.show(newTextNode.id, nodePos)
        }
        // if at the last list item, remove the item and append the paragraph
        else if (itemPos >= L-1) {
          node.remove(listItem.id)
          tx.delete(listItem.id)
          container.show(newTextNode.id, nodePos+1)
        }
        // otherwise create a new list
        else {
          let tail = []
          const items = node.items.slice()
          for (let i = L-1; i > itemPos; i--) {
            tail.unshift(items[i])
            node.remove(items[i])
          }
          node.remove(items[itemPos])
          let newList = tx.create({
            type: 'list',
            items: tail,
            ordered: node.ordered
          })
          container.show(newTextNode.id, nodePos+1)
          container.show(newList.id, nodePos+2)
        }
        tx.setSelection({
          type: 'property',
          path: newTextNode.getTextPath(),
          startOffset: 0
        })
      }
      // insert a new paragraph above the current one
      else {
        newItem.content = ""
        newItem = tx.create(newItem)
        node.insertItemAt(itemPos, newItem.id)
        tx.setSelection({
          type: 'property',
          path: listItem.getTextPath(),
          startOffset: 0
        })
      }
    }
    // otherwise split the text property and create a new paragraph node with trailing text and annotations transferred
    else {
      newItem.content = text.substring(offset)
      newItem = tx.create(newItem)
      // Now we need to transfer annotations
      if (offset < text.length) {
        // transfer annotations which are after offset to the new node
        annotationHelpers.transferAnnotations(tx, path, offset, [newItem.id,'content'], 0)
        // truncate the original property
        tx.update(path, { type: 'delete', start: offset, end: text.length })
      }
      node.insertItemAt(itemPos+1, newItem.id)
      tx.setSelection({
        type: 'property',
        path: newItem.getTextPath(),
        startOffset: 0
      })
    }
  }

  _merge(tx, node, coor, direction, container) {
    // detect cases where list items get merged
    // within a single list node
    if (node.isList()) {
      let list = node
      let itemId = coor.path[0]
      let itemPos = list.getItemPosition(itemId)
      let withinListNode = (
        (direction === 'left' && itemPos > 0) ||
        (direction === 'right' && itemPos<list.items.length-1)
      )
      if (withinListNode) {
        itemPos = (direction === 'left') ? itemPos-1 : itemPos
        let target = list.getItemAt(itemPos)
        let targetLength = target.getLength()
        documentHelpers.mergeListItems(tx, list.id, itemPos)
        tx.setSelection({
          type: 'property',
          path: target.getTextPath(),
          startOffset: targetLength,
          containerId: container.id
        })
        return
      }
    }
    // in all other cases merge is done across node boundaries
    let nodePos = container.getPosition(node, 'strict')
    if (direction === 'left' && nodePos > 0) {
      this._mergeNodes(tx, container, nodePos-1, direction)
    } else if (direction === 'right' && nodePos<container.getLength()-1) {
      this._mergeNodes(tx, container, nodePos, direction)
    }
  }

  _mergeNodes(tx, container, pos, direction) {
    let first = container.getChildAt(pos)
    let second = container.getChildAt(pos+1)
    if (first.isText()) {
      // Simplification for empty nodes
      if (first.isEmpty()) {
        container.hide(first.id)
        tx.delete(first.id)
        // TODO: need to clear where to handle
        // selections ... probably better not to do it here
        setCursor(tx, second, container.id, 'before')
        return
      }
      let target = first
      let targetPath = target.getTextPath()
      let targetLength = target.getLength()
      if (second.isText()) {
        let source = second
        let sourcePath = source.getTextPath()
        container.hide(source.id)
        // append the text
        tx.update(targetPath, { type: 'insert', start: targetLength, text: source.getText() })
        // transfer annotations
        annotationHelpers.transferAnnotations(tx, sourcePath, 0, targetPath, targetLength)
        tx.delete(source.id)
        tx.setSelection({
          type: 'property',
          path: targetPath,
          startOffset: targetLength,
          containerId: container.id
        })
      } else if (second.isList()) {
        let list = second
        let source = list.getFirstItem()
        let sourcePath = source.getTextPath()
        // remove merged item from list
        list.removeItemAt(0)
        // append the text
        tx.update(targetPath, { type: 'insert', start: targetLength, text: source.getText() })
        // transfer annotations
        annotationHelpers.transferAnnotations(tx, sourcePath, 0, targetPath, targetLength)
        // delete item and prune empty list
        tx.delete(source.id)
        if (list.getLength() === 0) {
          container.hide(list.id)
          tx.delete(list.id)
        }
        tx.setSelection({
          type: 'property',
          path: targetPath,
          startOffset: targetLength,
          containerId: container.id
        })
      } else {
        selectNode(tx, direction === 'left' ? first.id : second.id, container.id)
      }
    } else if (first.isList()) {
      if (second.isText()) {
        let source = second
        let sourcePath = source.getTextPath()
        let target = first.getLastItem()
        let targetPath = target.getTextPath()
        let targetLength = target.getLength()
        // hide source
        container.hide(source.id)
        // append the text
        tx.update(targetPath, { type: 'insert', start: targetLength, text: source.getText() })
        // transfer annotations
        annotationHelpers.transferAnnotations(tx, sourcePath, 0, targetPath, targetLength)
        tx.delete(source.id)
        tx.setSelection({
          type: 'property',
          path: target.getTextPath(),
          startOffset: targetLength,
          containerId: container.id
        })
      } else if (second.isList()) {
        container.hide(second.id)
        let firstItems = first.items.slice()
        let secondItems = second.items.slice()
        for (let i=0; i<secondItems.length;i++) {
          second.removeItemAt(0)
          first.appendItem(secondItems[i])
        }
        tx.delete(second.id)
        if (direction === 'left') {
          tx.setSelection({
            type: 'property',
            path: tx.get(secondItems[0]).getTextPath(),
            startOffset: 0,
            containerId: container.id
          })
        } else {
          let item = tx.get(last(firstItems))
          tx.setSelection({
            type: 'property',
            path: item.getTextPath(),
            startOffset: item.getLength(),
            containerId: container.id
          })
        }
      } else {
        selectNode(tx, direction === 'left' ? first.id : second.id, container.id)
      }
    } else {
      if (second.isText() && second.isEmpty()) {
        container.hide(second.id)
        tx.delete(second.id)
        setCursor(tx, first, container.id, 'after')
      } else {
        selectNode(tx, direction === 'left' ? first.id : second.id, container.id)
      }
    }
  }
}

export default Editing
