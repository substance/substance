import deleteSelection from './deleteSelection'
import breakNode from './breakNode'
import uuid from '../../util/uuid'

/**
  Inserts a new node at the given selection/cursor.

  @param {Object} args object with `selection`, `containerId` and `node` that has the node data

  @return {Object} object with updated selection

  @example

  ```js
  insertNode(tx, {
    selection: bodyEditor.getSelection(),
    containerId: bodyEditor.getContainerId(),
    node: {
      id: 'nodeId',
      type: 'paragraph',
      content: 'hello'
    }
  });
  ```
*/

function insertNode(tx, args) {
  let selection = args.selection
  let node = args.node
  if (!args.containerId) {
    throw new Error("containerId is mandatory")
  }
  if (!args.selection) {
    throw new Error("selection is mandatory")
  }
  if (!args.node) {
    throw new Error("node is mandatory")
  }
  let containerId = args.containerId
  let container = tx.get(containerId)
  let tmp
  if (!selection.isCollapsed()) {
    tmp = deleteSelection(tx, args)
    selection = tmp.selection
  }
  tmp = breakNode(tx, args)
  selection = tmp.selection

  let secondId = selection.start.getNodeId()
  let second = tx.get(secondId)
  let nodePos = container.getPosition(secondId)

  // remove empty text node created by breakNode
  if (second.isText() && second.getText().length === 0) {
    container.hide(secondId)
    tx.delete(secondId)
  }

  // create the node if it does not exist yet
  // notice, that it is also allowed to insert an existing node
  if (!node.id) {
    node.id = uuid(node.type)
  }
  // this transform can be called to insert an existing node
  // in this case the document contains the id already
  if (!tx.get(node.id)) {
    node = tx.create(node)
  }
  node = tx.get(node.id)

  // insert the new node after the node where the cursor was
  container.show(node.id, nodePos)

  // if the new node is a text node we can set the cursor to the
  // first character position
  if (node.isText()) {
    args.selection = tx.createSelection({
      type: 'property',
      path: [node.id, 'content'],
      startOffset: 0
    })
  }
  // otherwise we select the whole new node
  else {
    args.selection = tx.createSelection({
      type: 'container',
      containerId: containerId,
      startPath: [node.id],
      startOffset: 0,
      endPath: [node.id],
      endOffset: 1
    })
  }

  return args
}

export default insertNode
