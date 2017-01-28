import forEach from '../util/forEach'
import isArrayEqual from '../util/isArrayEqual'
import isString from '../util/isString'
import uuid from '../util/uuid'
import annotationHelpers from '../model/annotationHelpers'
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
    let nodeData
    if (sel.isPropertySelection()) {
      if (AnnotationClass.prototype._isAnnotation) {
        nodeData = {
          start: sel.start,
          end: sel.end,
          containerId: sel.containerId,
        }
      } else {
        throw new Error('Annotation can not be created for a selection.')
      }
    } else if (sel.isContainerSelection()) {
      if (AnnotationClass.prototype._isContainerAnnotation) {
        nodeData = {
          containerId: sel.containerId,
          start: sel.start,
          end: sel.end
        }
      } else if (AnnotationClass.prototype._isPropertyAnnotation) {
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
      } else if (sel.isAfter()) {
        tx.update(container.getContentPath(), { type: 'insert', pos: nodePos+1, value: textNode.id })
        this._setCursor(tx, textNode, containerId, 'before')
      } else {
        tx.update(container.getContentPath(), { type: 'delete', pos: nodePos })
        tx.delete(nodeId)
        tx.update(container.getContentPath(), { type: 'insert', pos: nodePos, value: textNode.id })
        this._setCursor(tx, textNode, containerId, 'before')
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
        // TODO: do we still want a soft-break thingie here? i.e. insert a <br>
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
          this._setCursor(tx, container.getNodeAt(nodePos+1), containerId, 'before')
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
        let container = tx.get(sel.containerId)
        this._merge(tx, node, sel.start, direction, container)
      } else {
        let startOffset = (direction === 'left') ? offset-1 : offset
        let endOffset = startOffset+1
        let start = { path: path, offset: startOffset }
        let end = { path: path, offset: endOffset }
        this._deleteTextRange(tx, start, end, sel.containerId)
      }
    }
    // deleting a range of characters with a text property
    else if (sel.isPropertySelection()) {
      let path = tx.getRealPath(sel.start.path)
      let node = tx.get(path[0])
      if (node.isText()) {
        this._deleteTextRange(tx, sel.start, sel.end, sel.containerId)
      }
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
              mode: 'full',
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
              mode: 'full',
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
    let realPath = tx.getRealPath(sel.path)
    let start = sel.start.offset
    let end = sel.end.offset
    tx.update(realPath, { type: 'delete', start: start, end: end })
    annotationHelpers.deletedText(tx, realPath, start, end)
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
      let node = tx.get(startId)
      if (node.isText()) {
        this._deleteTextRange(tx, start, end, containerId)
      } else {
        throw new Error('Not supported yet.')
      }
      return
    }

    // normalize the range if it is 'reverse'
    if (startPos > endPos) {
      [start, end] = [end, start];
      [startPos, endPos] = [endPos, startPos];
      [startId, endId] = [endId, startId]
    }

    // we need to detect if start and end nodes are selected entirely
    // 1. If both are entirely selected
    // 1.1. and the first is a TextNode, the first should be cleared, all others be removed
    // 1.2. and the first is not a TextNode, then all should be removed and an empty paragraph should be inserted
    // 2. If first is entirely selected and the last partially, then the last should be truncated and all others removed
    // 3. If first is partially selected and the last entirely, then the first should be truncated and all others removed
    // 4. If first and last are partially selected, all inner nodes should be removed and first and last be merged if possible

    let firstNode = tx.get(start.getNodeId())
    let lastNode = tx.get(end.getNodeId())
    let firstEntirelySelected = this._isEntirelySelected(tx, firstNode, start, null)
    let lastEntirelySelected = this._isEntirelySelected(tx, lastNode, null, end)

    // delete or truncate last node
    if (lastEntirelySelected) {
      tx.update([container.id, 'nodes'], { type: 'delete', pos: endPos })
      this._deleteNode(tx, lastNode)
    } else {
      if (lastNode.isText()) {
        this._deleteTextRange(tx, null, end, containerId)
      } else {
        throw new Error('Not supported yet')
      }
    }

    // delete inner nodes
    for (let i = endPos-1; i > startPos; i--) {
      let nodeId = container.nodes[i]
      // remove from container
      tx.update([container.id, 'nodes'], { type: 'delete', pos: i })
      // delete node
      this._deleteNode(tx, tx.get(nodeId))
    }

    if (firstNode.isText()) {
      this._deleteTextRange(tx, start, null, containerId)
    } else if (firstNode.isList()) {
      throw new Error('Not supported yet')
    } else if (firstEntirelySelected && lastEntirelySelected) {
      // remove from container
      tx.update([container.id, 'nodes'], { type: 'delete', pos: startPos })
      this._deleteNode(tx, firstNode)
      // insert a new paragraph
      let textNode = tx.createDefaultTextNode()
      tx.update([container.id, 'nodes'], { type: 'insert', pos: startPos, value: textNode.id })
    } else {
      throw new Error('Not supported yet')
    }

    // merge the last if possible
    if (!firstEntirelySelected && !lastEntirelySelected) {
      this._merge(tx, firstNode, sel.start, 'right', container)
    }
    tx.setSelection(sel.collapse('left'))
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
    this._deleteNode(tx, node)
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
          this._setCursor(tx, blockNode, container.id, 'after')
        }
        // insert before
        else if (sel.start.offset === 0) {
          tx.update(container.getContentPath(), { type: 'insert', pos: nodePos, value: blockNode.id })
        }
        // insert after
        else if (sel.start.offset === text.length) {
          tx.update(container.getContentPath(), { type: 'insert', pos: nodePos+1, value: blockNode.id })
          this._setCursor(tx, blockNode, container.id, 'before')
        }
        // break
        else {
          this.break(tx)
          tx.update(container.getContentPath(), { type: 'insert', pos: nodePos+1, value: blockNode.id })
          this._setCursor(tx, blockNode, container.id, 'after')
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
      this._setCursor(tx, textNode, sel.containerId, 'after')
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

  _isEntirelySelected(tx, node, start, end) {
    if (node.isText()) {
      if (start && start.offset !== 0) return false
      if (end && end.offset < node.getLength()) return false
    } else if (node.isList()) {
      if (start) {
        let itemId = start.path[2]
        let itemPos = node.getItemPosition(itemId)
        if (itemPos > 0 || start.offset !== 0) return false
      }
      if (end) {
        let itemId = end.path[2]
        let itemPos = node.getItemPosition(itemId)
        let item = tx.get(itemId)
        if (itemPos < node.items.length-1 || end.offset < item.getLength()) return false
      }
    } else {
      if (start) {
        console.assert(start.isNodeCoordinate(), 'expected a NodeCoordinate')
        if (start.offset > 0) return false
      }
      if (end) {
        console.assert(end.isNodeCoordinate(), 'expected a NodeCoordinate')
        if (end.offset === 0) return false
      }
    }
    return true
  }

  _setCursor(tx, node, containerId, mode) {
    if (node.isText()) {
      let offset = 0
      if (mode === 'after') {
        let text = node.getText()
        offset = text.length
      }
      tx.setSelection({
        type: 'property',
        path: node.getTextPath(),
        startOffset: offset,
        containerId: containerId
      })
    } else {
      tx.setSelection({
        type: 'node',
        containerId: containerId,
        nodeId: node.id,
        mode: mode
      })
    }
  }

  /*
    Deletes a node and its children and attached annotations
    and removes it from a given container
  */
  _deleteNode(tx, node) {
    if (node.isText()) {
      // remove all associated annotations
      let annos = tx.getIndex('annotations').get(node.id)
      for (let i = 0; i < annos.length; i++) {
        tx.delete(annos[i].id);
      }
    }
    // delete recursively
    // ATM we do a cascaded delete if the property has type 'id' or ['array', 'id'] and property 'owned' set,
    // or if it 'file'
    let nodeSchema = node.getSchema()
    forEach(nodeSchema, (prop) => {
      if ((prop.isReference() && prop.isOwned()) || (prop.type === 'file')) {
        if (prop.isArray()) {
          let ids = node[prop.name]
          ids.forEach((id) => {
            this._deleteNode(tx, tx.get(id))
          })
        } else {
          this._deleteNode(tx, tx.get(node[prop.name]))
        }
      }
    })
    tx.delete(node.id)
  }

  /*
    <-->: anno
    |--|: area of change
    I: <--> |--|     :   nothing
    II: |--| <-->    :   move both by total span
    III: |-<-->-|    :   delete anno
    IV: |-<-|->      :   move start by diff to start, and end by total span
    V: <-|->-|       :   move end by diff to start
    VI: <-|--|->     :   move end by total span
  */
  _deleteTextRange(tx, start, end, containerId) {
    if (!start) {
      start = {
        path: end.path,
        offset: 0
      }
    }
    let realPath = tx.getRealPath(start.path)
    let node = tx.get(realPath[0])
    if (!node.isText()) throw new Error('Expecting a TextNode.')
    if (!end) {
      end = {
        path: start.path,
        offset: node.getLength()
      }
    }
    if (!isArrayEqual(start.path, end.path)) throw new Error('Unsupported state: selection should be on one property')
    let startOffset = start.offset
    let endOffset = end.offset
    tx.update(realPath, { type: 'delete', start: startOffset, end: endOffset })
    // update annotations
    let annos = tx.getAnnotations(realPath)
    annos.forEach(function(anno) {
      let annoStart = anno.start.offset
      let annoEnd = anno.end.offset
      // I anno is before
      if (annoEnd<=startOffset) {
        return
      }
      // II anno is after
      else if (annoStart>=endOffset) {
        tx.update([anno.id, 'start'], { type: 'shift', value: startOffset-endOffset })
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset })
      }
      // III anno is deleted
      else if (annoStart>=startOffset && annoEnd<=endOffset) {
        tx.delete(anno.id)
      }
      // IV anno.start between and anno.end after
      else if (annoStart>=startOffset && annoEnd>=endOffset) {
        if (annoStart>startOffset) {
          tx.update([anno.id, 'start'], { type: 'shift', value: startOffset-annoStart })
        }
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset })
      }
      // V anno.start before and anno.end between
      else if (annoStart<=startOffset && annoEnd<=endOffset) {
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-annoEnd })
      }
      // VI anno.start before and anno.end after
      else if (annoStart<startOffset && annoEnd >= endOffset) {
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset })
      }
      else {
        console.warn('TODO: handle annotation update case.')
      }
    })
    tx.setSelection({
      type: 'property',
      path: start.path,
      startOffset: startOffset,
      containerId: containerId
    })
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
    let realPath = tx.getRealPath(start.path)
    let startOffset = start.offset
    let endOffset = end.offset
    let typeover = !sel.isCollapsed()
    let L = text.length
    // delete selected text
    if (typeover) {
      tx.update(realPath, { type: 'delete', start: startOffset, end: endOffset })
    }
    // insert new text
    tx.update(realPath, { type: 'insert', start: startOffset, text: text })
    // update annotations
    let annos = tx.getAnnotations(realPath)
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
      else if (annoStart>=startOffset && annoEnd<endOffset) {
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
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset+L })
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
    let realPath = tx.getRealPath(path)
    let listItem = tx.get(realPath[0])

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
          path: node.getItemPath(listItem.id),
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
        annotationHelpers.transferAnnotations(tx, realPath, offset, [newItem.id,'content'], 0)
        // truncate the original property
        tx.update(realPath, { type: 'delete', start: offset, end: text.length })
      }
      node.insertItemAt(itemPos+1, newItem.id)
      tx.setSelection({
        type: 'property',
        path: node.getItemPath(newItem.id),
        startOffset: 0
      })
    }
  }

  _merge(tx, node, coor, direction, container) {
    // detect cases where list items get merged
    // within a single list node
    if (node.isList()) {
      let list = node
      let itemId = coor.path[2]
      let itemPos = list.getItemPosition(itemId)
      if (direction === 'left' && itemPos > 0) {
        this._mergeListItems(tx, list, itemPos-1, container)
        return
      } else if (direction === 'right' && itemPos<list.items.length-1) {
        this._mergeListItems(tx, list, itemPos, container)
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
        _selectNode(tx, direction === 'left' ? first.id : second.id, container.id)
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
          // ATTENTION: we need to use a list relative path here
          // such as ['list1', 'items', 'list-item1', 'content']
          path: first.getItemPath(target.id),
          startOffset: targetLength,
          containerId: container.id
        })
      } else if (second.isList()) {
        container.hide(second.id)
        let items = second.items.slice()
        for (let i=0; i<items.length;i++) {
          second.removeItemAt(0)
          first.appendItem(items[i])
        }
        tx.delete(second.id)
      } else {
        _selectNode(tx, direction === 'left' ? first.id : second.id, container.id)
      }
    } else {
      _selectNode(tx, direction === 'left' ? first.id : second.id, container.id)
    }
  }

  _mergeListItems(tx, list, itemPos, container) {
    let target = list.getItemAt(itemPos)
    let targetPath = target.getTextPath()
    let targetLength = target.getLength()
    let source = list.getItemAt(itemPos+1)
    let sourcePath = source.getTextPath()
    // hide source
    list.removeItemAt(itemPos+1)
    // append the text
    tx.update(targetPath, { type: 'insert', start: targetLength, text: source.getText() })
    // transfer annotations
    annotationHelpers.transferAnnotations(tx, sourcePath, 0, targetPath, targetLength)
    tx.delete(source.id)
    tx.setSelection({
      type: 'property',
      // ATTENTION: we need to use a list relative path here
      // such as ['list1', 'items', 'list-item1', 'content']
      path: list.getItemPath(target.id),
      startOffset: targetLength,
      containerId: container.id
    })
  }
}

function _selectNode(tx, nodeId, containerId) {
  tx.setSelection({
    type: 'node',
    mode: 'full',
    nodeId: nodeId,
    containerId: containerId
  })
}

export default Editing
