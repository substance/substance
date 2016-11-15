/*
 * Delete a node and all annotations attached to it,
 * and removes the node from all containers.
 *
 * @param args object with fields: `nodeId`.
 */
function deleteNode(tx, args) {
  let nodeId = args.nodeId
  if (!nodeId) {
    throw new Error('Parameter `nodeId` is mandatory.')
  }
  let node = tx.get(nodeId)
  if (!node) {
    console.warn('Node does not exist')
    return args
  }
  // optional: containerId - will hide the node before removing it
  let containerId = args.containerId
  let container

  // remove all associated annotations
  let annos = tx.getIndex('annotations').get(nodeId)
  let i
  for (i = 0; i < annos.length; i++) {
    tx.delete(annos[i].id);
  }
  // transfer anchors of ContainerAnnotations to previous or next node:
  //  - start anchors go to the next node
  //  - end anchors go to the previous node
  let anchors = tx.getIndex('container-annotation-anchors').get(nodeId)
  for (i = 0; i < anchors.length; i++) {
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
  // NOTE: hiding automatically is causing troubles with nested containers
  //  else {
  //   // or hide it from all containers
  //   each(tx.getIndex('type').get('container'), function(container) {
  //     container.hide(nodeId);
  //   });
  // }

  // delete nested nodes
  if (node.hasChildren()) {
    node.getChildren().forEach(function(child) {
      deleteNode(tx, { nodeId: child.id })
    })
  }
  // finally delete the node itself
  tx.delete(nodeId)

  return {
    selection: newSel
  }
}

export default deleteNode
