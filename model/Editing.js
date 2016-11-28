import annotationHelpers from '../model/annotationHelpers'
import PropertySelection from '../model/PropertySelection'
import TextNodeEditing from '../model/TextNodeEditing'
import ListEditing from '../packages/list/ListEditing'
import uuid from '../util/uuid'

/**
  Core editing implementation, that controls meta behavior
  such as deleting a selection, merging nodes, etc.

  Some of the implementation are then delegated to specific editing behaviors,
  such as manipulating content of a text-property, merging or breaking text nodes

  Note: this is pretty much the same what we did with transforms before.
        We decided to move this here, to switch to a stateful editor implementation (aka turtle-graphics-style)
 */
class Editing {

  constructor() {
    // TODO: this should come from configurator
    this.nodeEditing = {
      text: new TextNodeEditing(),
      list: new ListEditing()
    }
  }

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
      if (AnnotationClass.prototype._isContainerAnnotation) {
        nodeData = {
          containerId: sel.containerId,
          startPath: sel.path,
          startOffset: sel.startOffset,
          endPath: sel.path,
          endOffset: sel.endOffset
        }
      } else if (AnnotationClass.prototype._isPropertyAnnotation) {
        nodeData = {
          path: sel.path,
          startOffset: sel.startOffset,
          endOffset: sel.endOffset
        }
      } else {
        throw new Error('Annotation can not be created for a property selection.')
      }
    } else if (sel.isContainerSelection()) {
      if (AnnotationClass.prototype._isContainerAnnotation) {
        nodeData = {
          containerId: sel.containerId,
          startPath: sel.path,
          startOffset: sel.startOffset,
          endPath: sel.path,
          endOffset: sel.endOffset
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
      let nodePos = container.getPosition(nodeId)
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
    } else if (sel.isCustomSelection()) {
      // TODO: what to do with custom selections?
    }
    else if (sel.isCollapsed() || sel.isPropertySelection()) {
      let containerId = sel.containerId
      if (!sel.isCollapsed()) {
        // delete the selection
        this.deletePropertySelection(tx, sel)
        tx.selection = sel.collapse('left')
      }
      // then break the node
      if (containerId) {
        let container = tx.get(containerId)
        let nodeId = sel.start.path[0]
        let node = tx.get(nodeId)
        let nodeEditing = this._getNodeEditing(node)
        nodeEditing.break(tx, node, sel.start, container)
      } else {
        // TODO: do we still want a soft-break thingie here? i.e. insert a <br>
      }
    } else if (sel.isContainerSelection()) {
      if (sel.start.hasSamePath(sel.end)) {
        this.deleteContainerSelection(tx, sel)
        this.break(tx)
      } else {
        let start = sel.start
        let containerId = sel.containerId
        let container = tx.get(containerId)
        let startNodeId = start.path[0]
        let nodePos = container.getPosition(startNodeId)
        this.deleteContainerSelection(tx, sel)
        if (nodePos < container.length-1) {
          this._setCursor(tx, container.getNodeAt(nodePos+1), containerId, 'before')
        } else {
          tx.selection = sel.collapse('left')
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
      if (sel.isFull() ||
          sel.isBefore() && direction === 'right' ||
          sel.isAfter() && direction === 'left' ) {
        // replace the node with default text node
        let nodeId = sel.getNodeId()
        let container = tx.get(sel.containerId)
        let nodePos = container.getPosition(nodeId)
        let contentPath = container.getContentPath()
        tx.update(contentPath, {delete: {offset: nodePos}})
        tx.delete(nodeId)
        let newNode = tx.createDefaultTextNode()
        tx.update(contentPath, { type: 'insert', pos: nodePos, value: newNode.id })
        tx.selection = tx.createSelection({
          type: 'property',
          path: newNode.getTextPath(),
          startOffset: 0,
          containerId: container.id,
        })
      } else {
        // just put the selection in the next or previous node
        // TODO: need to be implemented
        console.log('TODO: put the selection into previous/next node.')
      }
      return
    }
    if (sel.isCustomSelection()) {
      // TODO: what to do with custom selections?
      return
    }
    // if the selection is collapsed this is the classical one-character deletion
    // either backwards (backspace) or forward (delete)
    if (sel.isCollapsed()) {
      let path = sel.start.path
      let node = tx.get(path[0])

      let nodeEditing = this._getNodeEditing(node)
      // TODO: are we sure that this is the default implementation? or is it specific to text nodes?
      let offset = sel.start.offset
      let text = tx.get(path)
      if ( ((offset === 0 && direction === 'left') || (offset === text.length && direction === 'right')) && sel.containerId) {
        // need to merge
        let container = tx.get(sel.containerId)
        let nodePos = container.getPosition(node.id)
        let previous = nodePos > 0 ? container.getNodeAt(nodePos-1) : null
        let next = nodePos < container.getLength()-1 ? container.getNodeAt(nodePos+1) : null
        nodeEditing.merge(tx, node, sel.start, container, direction, previous, next)
      } else {
        let start = offset
        if (direction === 'left') start = start-1
        let end = start+1
        nodeEditing.delete(tx, {
          start: { path: path, offset: start},
          end: { path: path, offset: end }
        })
        // TODO: this should go into the nodeEditing impl
        tx.selection = new PropertySelection({
          path: path,
          startOffset: start,
          containerId: sel.containerId
        })
      }
      return
    }
    // simple deletion of a range of characters
    if (sel.isPropertySelection()) {
      let path = sel.start.path
      let node = tx.get(path[0])
      let nodeEditing = this._getNodeEditing(node)
      nodeEditing.delete(tx, sel)
    }
    else if (sel.isContainerSelection()) {
      this.deleteContainerSelection(tx, sel)
    }
  }

  deletePropertySelection(tx, sel) {
    let realPath = tx.getRealPath(sel.path)
    let start = sel.startOffset
    let end = sel.endOffset
    tx.update(realPath, { type: 'delete', start: start, end: end })
    annotationHelpers.deletedText(tx, realPath, start, end)
  }

  // deletes all inner nodes and 'truncates' start and end node
  deleteContainerSelection(tx, sel) {
    let containerId = sel.containerId
    let container = tx.get(containerId)
    let startPath = sel.startPath
    let endPath = sel.endPath
    let startId = startPath[0]
    let endId = endPath[0]
    let startPos = container.getPosition(startId)
    let endPos = container.getPosition(endId)

    // delete or truncate last node
    if (startPos < endPos) {
      if (sel.end.isNodeCoordinate() && sel.end.offset > 0) {
        tx.update([container.id, 'nodes'], { type: 'delete', pos: endPos })
        tx.delete(endId)
      } else {
        let endNode = tx.get(endId)
        let endEditing = this._getNodeEditing(endNode)
        endEditing.delete(tx, { start: 'before', end: sel.end })
      }
    }

    // delete inner nodes
    for (var i = endPos-1; i > startPos; i--) {
      let nodeId = container.nodes[i]
      // remove from container
      tx.update([container.id, 'nodes'], { type: 'delete', pos: i })
      // delete node
      tx.delete(nodeId)
    }

    // if the first node coordinate is node before -> delete the node and insert a default text node
    if (sel.start.isNodeCoordinate() && sel.start.offset === 0) {
      tx.update([container.id, 'nodes'], { type: 'delete', pos: startPos })
      tx.delete(startId)
      let startNode = tx.createDefaultTextNode()
      tx.update([container.id, 'nodes'], { type: 'insert', pos: startPos, value: startNode.id })
      tx.selection = new PropertySelection({
        path: startNode.getTextPath(),
        startOffset: 0,
        containerId: sel.containerId,
        surfaceId: sel.surfaceId
      })
    } else {
      let startNode = tx.get(startId)
      let startEditing = this._getNodeEditing(startNode)
      startEditing.delete(tx, { start: sel.start, end: 'after' })
      tx.selection = sel.collapse('left')
    }
  }

  /*
    Delete a node and all annotations attached to it,
    and removes the node from all containers.

    @param {String} nodeId
    @param {String} [containerId]
   */
  deleteNode(tx, nodeId, containerId) {
    if (!nodeId) throw new Error('Parameter `nodeId` is mandatory.')
    let node = tx.get(nodeId)
    if (!node) throw new Error('Node does not exist')

    let container
    // remove all associated annotations
    let annos = tx.getIndex('annotations').get(nodeId)
    for (let i = 0; i < annos.length; i++) {
      tx.delete(annos[i].id);
    }
    // transfer anchors of ContainerAnnotations to previous or next node:
    //  - start anchors go to the next node
    //  - end anchors go to the previous node
    let anchors = tx.getIndex('container-annotation-anchors').get(nodeId)
    for (let i = 0; i < anchors.length; i++) {
      let anchor = anchors[i]
      container = tx.get(anchor.containerId)
      // Note: during the course of this loop we might have deleted the node already
      // so, don't do it again
      if (!tx.get(anchor.id)) continue
      let pos = container.getPosition(anchor.path[0])
      let path, offset
      if (anchor.isStart) {
        if (pos < container.getLength()-1) {
          let nextNode = container.getChildAt(pos+1)
          if (nextNode.isText()) {
            path = [nextNode.id, 'content']
          } else {
            path = [nextNode.id]
          }
          tx.set([anchor.id, 'startPath'], path)
          tx.set([anchor.id, 'startOffset'], 0)
        } else {
          tx.delete(anchor.id)
        }
      } else {
        if (pos > 0) {
          let previousNode = container.getChildAt(pos-1)
          if (previousNode.isText()) {
            path = [previousNode.id, 'content']
            offset = tx.get(path).length
          } else {
            path = [previousNode.id]
            offset = 1
          }
          tx.set([anchor.id, 'endPath'], path)
          tx.set([anchor.id, 'endOffset'], offset)
        } else {
          tx.delete(anchor.id)
        }
      }
    }
    let newSel = null
    if (containerId) {
      // hide the node from the one container if provided
      container = tx.get(containerId)
      let nodePos = container.getPosition(nodeId)
      if (nodePos >= 0) {
        if (nodePos < container.getLength()-1) {
          let nextNode = container.getNodeAt(nodePos+1)
          if (nextNode.isText()) {
            newSel = tx.createSelection({
              type: 'property',
              containerId: containerId,
              path: nextNode.getTextPath(),
              startOffset: 0,
              endOffset: 0
            })
          } else {
            newSel = tx.createSelection({
              type: 'node',
              containerId: containerId,
              nodeId: nextNode.id,
              mode: 'before',
              reverse: false
            })
          }
        }
      }
      container.hide(nodeId)
    }
    // delete nested nodes
    // TODO: revisit this
    if (node.hasChildren()) {
      node.getChildren().forEach(function(child) {
        deleteNode(tx, { nodeId: child.id })
      })
    }
    // finally delete the node itself
    tx.delete(nodeId)
    tx.selection = newSel
  }

  insertInlineNode(tx, nodeData) {
    let sel = tx.selection
    if (!sel.isPropertySelection()) throw new Error('insertInlineNode requires a PropertySelection')
    let text = "\uFEFF"
    this.insertText(tx, text)
    sel = tx.selection
    let endOffset = tx.selection.endOffset
    let startOffset = endOffset - text.length
    nodeData = Object.assign({}, nodeData, {
      path: sel.path,
      startOffset: startOffset,
      endOffset: endOffset
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
      let nodePos = container.getPosition(sel.getNodeId())
      // insert before
      if (sel.isBefore()) {
        tx.update(container.getContentPath(), { type: 'insert', pos: nodePos, value: blockNode.id })
      }
      // insert after
      else if (sel.isAfter()) {
        tx.update(container.getContentPath(), { type: 'insert', pos: nodePos+1, value: blockNode.id })
        tx.selection = tx.createSelection({
          type: 'node',
          containerId: containerId,
          nodeId: blockNode.id,
          mode: 'after'
        })
      } else {
        tx.update(container.getContentPath(), { type: 'delete', pos: nodePos })
        tx.delete(sel.getNodeId())
        tx.update([container.id, 'nodes'], { type: 'insert', pos: nodePos, value: blockNode.id })
        tx.selection = tx.createSelection({
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
        tx.selection = sel.collapse('left')
      }
      let node = tx.get(sel.path[0])
      if (!node) throw new Error('Invalid selection.')
      let nodePos = container.getPosition(node.id)
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
        else if (sel.startOffset === 0) {
          tx.update(container.getContentPath(), { type: 'insert', pos: nodePos, value: blockNode.id })
        }
        // insert after
        else if (sel.startOffset === text.length) {
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
          tx.selection = tx.createSelection({
            type: 'property',
            path: start.path,
            startOffset: start.offset,
            containerId: sel.containerId,
          })
        } else if (start.isNodeCoordinate()) {
          tx.selection = tx.createSelection({
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
      let nodePos = container.getPosition(nodeId)
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
      let path = sel.start.path
      let nodeId = path[0]
      let node = tx.get(nodeId)
      let nodeEditing = this._getNodeEditing(node)
      // console.log('#### before', sel.toString())
      nodeEditing.type(tx, sel, text)
      if (node.isText()) {
        let offset = sel.startOffset + text.length
        tx.selection = new PropertySelection({
          path: path,
          startOffset: offset,
          containerId: sel.containerId,
          surfaceId: sel.surfaceId
        })
      }
      // console.log('### setting selection after typing: ', tx.selection.toString())
    } else if (sel.isContainerSelection()) {
      this.deleteContainerSelection(tx, sel)
      this.insertText(tx, text)
    }
  }

  _setCursor(tx, node, containerId, mode) {
    if (node.isText()) {
      let offset = 0
      if (mode === 'after') {
        let text = node.getText()
        offset = text.length
      }
      tx.selection = tx.createSelection({
        type: 'property',
        path: node.getTextPath(),
        startOffset: offset,
        containerId: containerId
      })
    } else {
      tx.selection = tx.createSelection({
        type: 'node',
        containerId: containerId,
        nodeId: node.id,
        mode: mode
      })
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
    let pos = container.getPosition(nodeId)
    if (pos >= 0) {
      container.hide(nodeId)
      container.show(newNode.id, pos)
    }
    // remove the old one from the document
    this.deleteNode(tx, node.id, containerId)
    tx.selection = tx.createSelection(newPath, sel.startOffset, sel.endOffset)

    return newNode
  }


  _getNodeEditing(node) {
    let nodeEditing = this.nodeEditing[node.type]
    if (!nodeEditing) {
      // iconsole.warn('No editing behavior defined for node type', node.type)
      if (!node.isText()) {
        console.warn('No editing behavior defined for node type', node.type, 'Falling back to text editing behavior')
      }
      nodeEditing = this.nodeEditing.text
    }
    return nodeEditing
  }
}

export default Editing
