import Selection from './Selection'
import PropertySelection from './PropertySelection'
import ContainerSelection from './ContainerSelection'
import NodeSelection from './NodeSelection'
import CustomSelection from './CustomSelection'
import last from '../util/last'

export function fromJSON(json) {
  if (!json) return Selection.nullSelection
  var type = json.type
  switch(type) {
    case 'property':
      return PropertySelection.fromJSON(json)
    case 'container':
      return ContainerSelection.fromJSON(json)
    case 'node':
      return NodeSelection.fromJSON(json)
    case 'custom':
      return CustomSelection.fromJSON(json)
    default:
      // console.error('Selection.fromJSON(): unsupported selection data', json)
      return Selection.nullSelection
  }
}

/*
  Helper to check if a coordinate is the first position of a node.
*/
export function isFirst(doc, coor) {
  if (coor.isNodeCoordinate() && coor.offset === 0) return true
  let node = doc.get(coor.path[0])
  if (node.isText() && coor.offset === 0) return true
  if (node.isList()) {
    let itemId = coor.path[2]
    if (node.items[0] === itemId && coor.offset === 0) return true
  }
}

/*
  Helper to check if a coordinate is the last position of a node.
*/
export function isLast(doc, coor) {
  if (coor.isNodeCoordinate() && coor.offset > 0) return true
  let node = doc.get(coor.path[0])
  if (node.isText() && coor.offset >= node.getLength()) return true
  if (node.isList()) {
    let itemId = coor.path[2]
    let item = doc.get(itemId)
    if (last(node.items) === itemId && coor.offset === item.getLength()) return true
  }
}

export function isEntirelySelected(tx, node, start, end) {
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

export function setCursor(tx, node, containerId, mode) {
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
  } else if (node.isList()) {
    let item, offset
    if (mode === 'after') {
      item = node.getLastItem()
      offset = item.getLength()
    } else {
      item = node.getFirstItem()
      offset = 0
    }
    tx.setSelection({
      type: 'property',
      path: item.getTextPath(),
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

export function selectNode(tx, nodeId, containerId) {
  tx.setSelection({
    type: 'node',
    mode: 'full',
    nodeId: nodeId,
    containerId: containerId
  })
}
