import extend from 'lodash/extend'
import annotationHelpers from '../annotationHelpers'
import deleteNode from './deleteNode'

let merge = function(tx, args) {
  let containerId = args.containerId
  let path = args.path
  let direction = args.direction
  if (!containerId || !path || !direction) {
    throw new Error('Insufficient arguments! mandatory fields: `containerId`, `path`, `direction`')
  }
  let container = tx.get(containerId)
  let nodeId = path[0]
  let node = tx.get(nodeId)
  let nodePos = container.getPosition(nodeId)
  let l = container.getLength()
  let tmp
  if (direction === 'right' && nodePos < l-1) {
    let nextNodeId = container.nodes[nodePos+1]
    let nextNode = tx.get(nextNodeId)
    if (node.isText() && node.getText().length === 0) {
      deleteNode(tx, {
        nodeId: nodeId,
        containerId: containerId
      })
      if (nextNode.isText()) {
        args.selection = tx.createSelection(nextNodeId, 0)
      } else {
        args.selection = tx.createSelection({
          type: 'node',
          nodeId: nextNodeId,
          containerId: containerId,
          mode: 'full'
        })
      }
    } else {
      tmp = _mergeNodes(tx, extend({}, args, {
        containerId: containerId,
        firstNodeId: nodeId,
        secondNodeId: nextNodeId
      }))
      args.selection = tmp.selection
    }
  } else if (direction === 'left' && nodePos > 0) {
    let previousNodeId = container.nodes[nodePos-1]
    let previousNode = tx.get(previousNodeId)
    if (node.isText() && node.getText().length === 0) {
      deleteNode(tx, {
        nodeId: nodeId,
        containerId: containerId
      })
      if (previousNode.isText()) {
        args.selection = tx.createSelection(previousNode.getTextPath(), previousNode.getText().length)
      } else {
        args.selection = tx.createSelection({
          type: 'node',
          nodeId: previousNodeId,
          containerId: containerId,
          mode: 'full'
        })
      }
    } else {
      tmp = _mergeNodes(tx, extend({}, args, {
        containerId: containerId,
        firstNodeId: previousNodeId,
        secondNodeId: nodeId
      }))
      args.selection = tmp.selection
    }
  }
  return args
}

function _mergeNodes(tx, args) {
  let firstNodeId = args.firstNodeId
  let secondNodeId = args.secondNodeId
  let firstNode = tx.get(firstNodeId)
  let secondNode = tx.get(secondNodeId)
  // most often a merge happens between two different nodes (e.g., 2 paragraphs)
  let mergeTrafo = _getNodeMerger(args.editingBehavior, firstNode, secondNode)
  if (mergeTrafo) {
    return mergeTrafo(tx, extend({}, args, {
      containerId: args.containerId,
      first: firstNode,
      second: secondNode
    }))
  }
  return args
}

function _getNodeMerger(behavior, node, otherNode) {
  if (behavior) {
    if (behavior.canMerge(node.type, otherNode.type)) {
      return behavior.getMerger(node.type, otherNode.type)
    }
    // Behaviors with text nodes involved
    //
    // 1. first textish, second custom
    // Example:
    //  <p>abc<p>
    //  <ul>
    //    <li>def</li>
    //    <li>ghi</li>
    //  </ul>
    //
    // could be transformed into
    //
    //  <p>abcdef<p>
    //  <ul>
    //    <li>ghi</li>
    //  </ul>
    else if (node.isInstanceOf('text') &&
      behavior.canMerge('textish', otherNode.type)) {
      return behavior.getMerger('textish', otherNode.type)
    }
    // 2. first custom, second textish
    // Example:
    //  <figure>
    //     ...
    //     <figcaption>abc</figcaption>
    //  </figure>
    //  <p>def</p>
    //
    //  could be transformed into
    //
    //  <figure>
    //     ...
    //     <figcaption>abcdef</figcaption>
    //  </figure>
    //
    else if (otherNode.isInstanceOf('text') &&
      behavior.canMerge(node.type, 'textish')) {
      return behavior.getMerger(node.type, 'textish')
    }
  }
  // Built-in behavior for textish nodes
  if (node.isInstanceOf('text') && otherNode.isInstanceOf('text')) {
    return _mergeTextNodes
  }
  console.info("No merge behavior defined for %s <- %s", node.type, otherNode.type)
  return null
}

function _mergeTextNodes(tx, args) {
  let containerId = args.containerId
  let first = args.first
  let second = args.second
  let container = tx.get(containerId)
  let firstPath = first.getTextPath()
  let firstText = first.getText()
  let firstLength = firstText.length
  let secondPath = second.getTextPath()
  let secondText = second.getText()
  let selection
  if (firstLength === 0) {
    // hide the second node
    container.hide(firstPath[0])
    // delete the second node
    tx.delete(firstPath[0])
    // set the selection to the end of the first component
    selection = tx.createSelection({
      type: 'property',
      path: secondPath,
      startOffset: 0
    })
  } else {
    // append the second text
    tx.update(firstPath, { insert: { offset: firstLength, value: secondText } })
    // transfer annotations
    annotationHelpers.transferAnnotations(tx, secondPath, 0, firstPath, firstLength)
    // hide the second node
    container.hide(secondPath[0])
    // delete the second node
    tx.delete(secondPath[0])
    // set the selection to the end of the first component
    selection = tx.createSelection({
      type: 'property',
      path: firstPath,
      startOffset: firstLength
    })
  }
  args.selection = selection
  return args
}

export default merge
