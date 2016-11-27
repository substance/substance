import annotationHelpers from '../model/annotationHelpers'
import PropertySelection from '../model/PropertySelection'
import TextNodeEditing from './TextNodeEditing'
import ListEditing from '../packages/list/ListEditing'
/**
  Core editing implementation, that controls meta behavior
  such as deleting a selection, merging nodes, etc.

  Some of the implementation are then delegated to specific editing behaviors,
  such as manipulating content of a text-property, merging or breaking text nodes
 */
class Editing {

  constructor(editorSession) {
    this.editorSession = editorSession
    // TODO: this should come from configurator
    this.nodeEditing = {
      text: new TextNodeEditing(),
      list: new ListEditing()
    }
  }

  /*
    Performs a deletion like expected from pressing `BACKSPACE` or `DELETE`.

    When the selection is collapsed, `direction` determines the direction
    of deletion.
  */
  delete(direction) {
    let selection = this._getSelection()
    if (selection.isNull()) return
    this.editorSession.transaction((tx) => {
      this._delete(tx, direction)
    }, { action: 'delete' })
  }

  /*
    Adds a break at the current position.
  */
  break() {
    let selection = this._getSelection()
    if (selection.isNull()) return
    this.editorSession.transaction((tx) => {
      this._break(tx)
    }, { action: 'break' })
  }

  /*
    Type text at the current position.
  */
  type(text) {
    let selection = this._getSelection()
    if (selection.isNull()) return
    this.editorSession.transaction((tx) => {
      this.insertText(tx, text)
    }, { action: 'type' })
  }

  _getSelection() {
    return this.editorSession.getSelection()
  }

  _delete(tx, direction) {
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
      this._deleteContainerSelection(tx, sel)
    }
  }

  _break(tx) {
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
        _selectBefore(tx, textNode, containerId)
      } else {
        tx.update(container.getContentPath(), { type: 'delete', pos: nodePos })
        tx.delete(nodeId)
        tx.update(container.getContentPath(), { type: 'insert', pos: nodePos, value: textNode.id })
        _selectBefore(tx, textNode, containerId)
      }
    } else if (sel.isCustomSelection()) {
      // TODO: what to do with custom selections?
    }
    else if (sel.isCollapsed() || sel.isPropertySelection()) {
      let containerId = sel.containerId
      if (!sel.isCollapsed()) {
        // delete the selection
        this._deletePropertySelection(tx, sel)
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
        this._deleteContainerSelection(tx, sel)
        this._break(tx)
      } else {
        let start = sel.start
        let containerId = sel.containerId
        let container = tx.get(containerId)
        let startNodeId = start.path[0]
        let nodePos = container.getPosition(startNodeId)
        this._deleteContainerSelection(tx, sel)
        if (nodePos < container.length-1) {
          _selectBefore(tx, container.getNodeAt(nodePos+1), containerId)
        } else {
          tx.selection = sel.collapse('left')
          this._break(tx)
        }
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
      tx.selection = new PropertySelection({
        path: textNode.getTextPath(),
        startOffset: text.length,
        containerId: sel.containerId,
        surfaceId: sel.surfaceId
      })
    } else if (sel.isCustomSelection()) {
      // TODO: what to do with custom selections?
    } else if (sel.isCollapsed() || sel.isPropertySelection()) {
      let path = sel.start.path
      let nodeId = path[0]
      let node = tx.get(nodeId)
      let nodeEditing = this._getNodeEditing(node)

      // console.log('#### before', sel.toString())
      nodeEditing.type(tx, sel, text)
      tx.selection = new PropertySelection({
        path: path,
        startOffset: sel.startOffset + text.length,
        containerId: sel.containerId,
        surfaceId: sel.surfaceId
      })
      // console.log('### setting selection after typing: ', tx.selection.toString())
    } else if (sel.isContainerSelection()) {
      this._deleteContainerSelection(tx, sel)
      this.insertText(tx, text)
    }
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
        this._deletePropertySelection(tx)
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
          _selectAfter(tx, blockNode, container.id)
        }
        // insert before
        else if (sel.startOffset === 0) {
          tx.update(container.getContentPath(), { type: 'insert', pos: nodePos, value: blockNode.id })
        }
        // insert after
        else if (sel.startOffset === text.length) {
          tx.update(container.getContentPath(), { type: 'insert', pos: nodePos+1, value: blockNode.id })
          _selectBefore(tx, blockNode, container.id)
        }
        // break
        else {
          this._break(tx)
          tx.update(container.getContentPath(), { type: 'insert', pos: nodePos+1, value: blockNode.id })
          _selectAfter(tx, blockNode, container.id)
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

  _deletePropertySelection(tx, sel) {
    let realPath = tx.getRealPath(sel.path)
    let start = sel.startOffset
    let end = sel.endOffset
    tx.update(realPath, { type: 'delete', start: start, end: end })
    annotationHelpers.deletedText(tx, realPath, start, end)
  }

  // deletes all inner nodes and 'truncates' start and end node
  _deleteContainerSelection(tx, sel) {
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

function _selectBefore(tx, node, containerId) {
  if (node.isText()) {
    tx.selection = tx.createSelection({
      type: 'property',
      path: node.getTextPath(),
      startOffset: 0,
      containerId: containerId
    })
  } else {
    tx.selection = tx.createSelection({
      type: 'node',
      containerId: containerId,
      nodeId: node.id,
      mode: 'before'
    })
  }
}

function _selectAfter(tx, node, containerId) {
  if (node.isText()) {
    let text = node.getText()
    tx.selection = tx.createSelection({
      type: 'property',
      path: node.getTextPath(),
      startOffset: text.length,
      containerId: containerId
    })
  } else {
    tx.selection = tx.createSelection({
      type: 'node',
      containerId: containerId,
      nodeId: node.id,
      mode: 'after'
    })
  }
}
