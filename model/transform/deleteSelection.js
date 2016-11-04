import extend from 'lodash/extend'
import last from 'lodash/last'
import uuid from '../../util/uuid'
import deleteNode from './deleteNode'
import merge from './merge'
import updateAnnotations from './updateAnnotations'

/**
  Deletes a given selection.

  @param {Object} args object with `selection`
  @return {Object} with updated `selection`

  @example

  ```js
  deleteSelection(tx, {
    selection: bodyEditor.getSelection(),
  });
  ```
*/

function deleteSelection(tx, args) {
  let selection = args.selection
  if (selection.isCollapsed()) {
    // nothing
  } else if (selection.isPropertySelection()) {
    args = _deletePropertySelection(tx, args)
  } else if (selection.isContainerSelection()) {
    args = _deleteContainerSelection(tx, args)
  } else if (selection.isNodeSelection()) {
    args = _deleteNodeSelection(tx, args)
  }
  return args
}

function _deletePropertySelection(tx, args) {
  let sel = args.selection
  let path = sel.path
  let startOffset = sel.startOffset
  let endOffset = sel.endOffset
  let op = tx.update(path, { type: 'delete', start: startOffset, end: endOffset })
  updateAnnotations(tx, {op: op})
  args.selection = tx.createSelection(path, startOffset)
  return args
}

function _deleteContainerSelection(tx, args) {
  let sel = args.selection
  let containerId = sel.containerId
  let container = tx.get(containerId)

  let startPos = container.getPosition(sel.start.path[0])
  // var endPos = container.getPosition(sel.end.path[0]);
  let fragments = sel.getFragments()
  if (fragments.length === 0) {
    return args
  }

  let remainingCoor = null
  let node, type

  for (let i = 0; i < fragments.length; i++) {
    let fragment = fragments[i]

    if (fragment.isPropertyFragment()) {
      if (fragment.isPartial()) {
        if (!remainingCoor) {
          remainingCoor = {
            path: fragment.path,
            offset: fragment.startOffset
          }
        }
        _deletePropertySelection(tx, {
          selection: fragment
        })
      } else {
        let nodeId = fragment.path[0]
        deleteNode(tx, extend({}, args, {
          nodeId: nodeId,
          containerId: container.id
        }))
      }
    } else if (fragment.isNodeFragment()) {
      deleteNode(tx, extend({}, args, {
        nodeId: fragment.nodeId,
        containerId: container.id
      }))
    }
  }

  // update the selection; take the first component which is not fully deleted
  if (remainingCoor) {
    args.selection = tx.createSelection(remainingCoor.path, remainingCoor.offset)
  } else {
    // if all nodes have been deleted insert a text node
    // TODO: in some cases this is not the desired behavior.
    // it is ok in cases such as:
    //  - when inserting text
    //  - pressing delete or backspace
    // this should not be done when
    //  - pasting a container (as opposed to property)
    //  - inserting a node
    // i.e. only before property operations
    type = tx.getSchema().getDefaultTextType()
    node = {
      type: type,
      id: uuid(type),
      content: ""
    }
    tx.create(node)
    container.show(node.id, startPos)
    args.selection = tx.createSelection([node.id, 'content'], 0)
  }

  // try to merge the first and last remaining nodes
  // NOTE: ATM only merges text nodes
  if (fragments.length > 1 &&
      fragments[0].isPartial() &&
      last(fragments).isPartial()) {
    merge(tx, extend({}, args, {
      selection: args.selection,
      containerId: containerId,
      path: sel.endPath,
      direction: 'left'
    }))
  }

  // If the container is empty insert an empty text node
  if (container.nodes.length === 0) {
    type = tx.getSchema().getDefaultTextType();
    node = {
      type: type,
      id: uuid(type),
      content: ""
    }
    tx.create(node)
    container.show(node.id, 0)
    args.selection = tx.createSelection([node.id, 'content'], 0)
  }

  return args
}

function _deleteNodeSelection(tx, args) {
  let sel = args.selection
  if (!sel || !sel.isNodeSelection()) {
    throw new Error("'sel' must be a NodeSelection")
  }
  if (!sel.isFull()) {
    return args
  }
  let nodeId = sel.getNodeId()
  let containerId = sel.containerId
  let container = tx.get(containerId)
  let pos = container.getPosition(nodeId)
  deleteNode(tx, {
    nodeId: nodeId,
    containerId: containerId
  })
  let newNode = tx.create({
    type: tx.getSchema().getDefaultTextType(),
    content: ""
  })
  container.show(newNode.id, pos)
  return {
    selection: tx.createSelection([newNode.id, 'content'], 0)
  }
}

export default deleteSelection
