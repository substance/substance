import extend from 'lodash/extend'
import uuid from '../../util/uuid'
import annotationHelpers from '../annotationHelpers'
import deleteNode from './deleteNode'

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
  });
  ```
*/

function switchTextType(tx, args) {
  let sel = args.selection
  if (!sel.isPropertySelection()) {
    console.error("Selection must be a PropertySelection.")
    return args
  }
  let path = sel.path
  let nodeId = path[0]
  let data = args.data
  let node = tx.get(nodeId)
  if (!(node.isInstanceOf('text'))) {
    console.warn('Trying to use switchTextType on a non text node. Skipping.')
    return args
  }
  // create a new node and transfer annotations
  let newNode = extend({
    id: uuid(data.type),
    type: data.type,
    content: node.content
  }, data)
  let newPath = [newNode.id, 'content']
  newNode = tx.create(newNode)
  annotationHelpers.transferAnnotations(tx, path, 0, newPath, 0)

  // hide the old one, show the new node
  let container = tx.get(args.containerId)
  let pos = container.getPosition(nodeId)
  if (pos >= 0) {
    container.hide(nodeId)
    container.show(newNode.id, pos)
  }
  // remove the old one from the document
  deleteNode(tx, { nodeId: node.id })

  args.selection = tx.createSelection(newPath, sel.startOffset, sel.endOffset)
  args.node = newNode

  return args
}

export default switchTextType
