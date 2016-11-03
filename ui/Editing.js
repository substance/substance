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
    this._transaction((tx) => {
      this._delete(tx, direction)
    }, { action: 'delete' })
  }

  /*
    Adds a break at the current position.
  */
  break() {
    let selection = this._getSelection()
    if (selection.isNull()) return
    this._transaction((tx) => {
      this._break(tx)
    }, { action: 'break' })
  }

  /*
    Type text at the current position.
  */
  type(text) {
    let selection = this._getSelection()
    if (selection.isNull()) return
    this._transaction((tx) => {
      this._type(tx, text)
    }, { action: 'type' })
  }

  _getSelection() {
    return this.editorSession.getSelection()
  }

  _getSurface() {
    return this.editorSession.getFocusedSurface()
  }

  _transaction(fn) {
    let selection = this._getSelection()
    let surface = this._getSurface()
    this.editorSession.transaction((tx) => {
      tx.selection = selection
      tx.surfaceId = surface.id
      fn(tx)
      return {
        selection: tx.selection
      }
    })
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
        tx.update(contentPath, {insert: {offset: nodePos, value: newNode.id}})
        tx.selection = PropertySelection.fromJSON({
          path: [],
          startOffset: 0,
          endOffset: 0,
          containerId: container.id,
          surfaceId: tx.surfaceId
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
      if (!nodeEditing) {
        console.warn('No editing behavior defined for node type', node.type)
        return
      }
      // TODO: are we sure that this is the default implementation? or is it specific to text nodes?
      let offset = sel.start.offset
      let text = tx.get(path)
      if (offset === 0 && direction === 'left') {
        // need to merge
        console.log('TODO: merge')
      } else if (offset === text.length && direction === 'right') {
        // need to merge
        console.log('TODO: merge')
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
          containerId: sel.containerId,
          surfaceId: sel.surfaceId
        })
      }
      return
    }
    // simple deletion of a range of characters
    if (sel.isPropertySelection()) {
      let path = sel.start.path
      let node = tx.get(path[0])
      let nodeEditing = this._getNodeEditing(node)
      if (!nodeEditing) {
        console.warn('No editing behavior defined for node type', node.type)
        return
      }
      nodeEditing.delete(tx, sel)
      tx.selection = new PropertySelection({
        path: sel.path,
        startOffset: sel.startOffset,
        containerId: sel.containerId,
        surfaceId: sel.surfaceId
      })
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
        container.show(textNode, nodePos)
      } else if (sel.isAfter()) {
        container.show(textNode, nodePos+1)
      } else {
        container.hide(nodeId)
        tx.delete(nodeId)
        container.show(textNode, nodePos)
      }
    } else if (sel.isCustomSelection()) {
      // TODO: what to do with custom selections?
    } else if (sel.isCollapsed() || sel.isPropertySelection()) {
      let containerId = sel.containerId
      if (!sel.isCollapsed()) {
        // delete the selection
        this._deletePropertySelection(tx, sel)
        sel.collapse('left')
      }
      // then break the node
      if (containerId) {
        console.log('Break node...')
      } else {
        // TODO: do we still want a soft-break thingie here? i.e. insert a <br>
      }
    } else if (sel.isContainerSelection()) {
      // delete the selection
      this._deleteContainerSelection(tx, sel)
      // but don't merge, simply set the selection at the beginning of the second node
    }
  }

  _type(tx, text) {
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
        startOffset: 0,
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
      if (nodeEditing) {
        // console.log('#### before', sel.toString())
        nodeEditing.type(tx, sel, text)
        tx.selection = new PropertySelection({
          path: path,
          startOffset: sel.startOffset + text.length,
          containerId: sel.containerId,
          surfaceId: sel.surfaceId
        })
        // console.log('### setting selection after typing: ', tx.selection.toString())
      } else {
        console.log('TODO: implement typing on node ', node.type)
      }
    } else if (sel.isContainerSelection()) {
      this._deleteContainerSelection(tx, sel)
      this._type(tx, text)
    }
  }

  _deletePropertySelection(tx, sel) {
    let realPath = tx.getRealPath(sel.path)
    let start = sel.startOffset
    let end = sel.endOffset
    tx.update(realPath, { delete: { start: start, end: end } })
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
        tx.update([container.id, 'nodes'], {delete: {offset: endPos}})
        tx.delete(endId)
      } else {
        let endNode = tx.get(endId)
        let endEditing = this._getNodeEditing(endNode)
        if (endEditing) {
          endEditing.delete(tx, { start: 'before', end: sel.end })
        } else {
          console.error('No editing behavior defined for node type' + endNode.type)
        }
      }
    }

    // delete inner nodes
    for (var i = endPos-1; i > startPos; i--) {
      let nodeId = container.nodes[i]
      // remove from container
      tx.update([container.id, 'nodes'], {delete: {offset: i}})
      // delete node
      tx.delete(nodeId)
    }

    // if the first node coordinate is node before -> delete the node and insert a default text node
    if (sel.start.isNodeCoordinate() && sel.start.offset === 0) {
      tx.update([container.id, 'nodes'], {delete: {offset: startPos}})
      tx.delete(startId)
      let startNode = tx.createDefaultTextNode()
      tx.update([container.id, 'nodes'], {insert: {offset: startPos, value: startNode.id}})
      tx.selection = new PropertySelection({
        path: startNode.getTextPath(),
        startOffset: 0,
        containerId: sel.containerId,
        surfaceId: sel.surfaceId
      })
    } else {
      let startNode = tx.get(startId)
      let startEditing = this._getNodeEditing(startNode)
      if (startEditing) {
        startEditing.delete(tx, { start: sel.start, end: 'after' })
      } else {
        console.error('No editing behavior defined for node type' + startNode.type)
      }
      tx.selection = sel.collapse('left')
    }
  }

  _getNodeEditing(node) {
    let nodeEditing = this.nodeEditing[node.type]
    if (!nodeEditing && node.isText()) {
      nodeEditing = this.nodeEditing.text
    }
    return nodeEditing
  }
}

export default Editing
