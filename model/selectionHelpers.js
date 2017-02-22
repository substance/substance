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
  let node = doc.get(coor.path[0]).getRoot()
  if (node.isText() && coor.offset === 0) return true
  if (node.isList()) {
    let itemId = coor.path[0]
    if (node.items[0] === itemId && coor.offset === 0) return true
  }
}

/*
  Helper to check if a coordinate is the last position of a node.
*/
export function isLast(doc, coor) {
  if (coor.isNodeCoordinate() && coor.offset > 0) return true
  let node = doc.get(coor.path[0]).getRoot()
  if (node.isText() && coor.offset >= node.getLength()) return true
  if (node.isList()) {
    let itemId = coor.path[0]
    let item = doc.get(itemId)
    if (last(node.items) === itemId && coor.offset === item.getLength()) return true
  }
}

export function isEntirelySelected(doc, node, start, end) {
  let { isEntirelySelected } = getRangeInfo(doc, node, start, end)
  return isEntirelySelected
}

export function getRangeInfo(doc, node, start, end) {
  let isFirst = true
  let isLast = true
  if (node.isText()) {
    if (start && start.offset !== 0) isFirst = false
    if (end && end.offset < node.getLength()) isLast = false
  } else if (node.isList()) {
    if (start) {
      let itemId = start.path[0]
      let itemPos = node.getItemPosition(itemId)
      if (itemPos > 0 || start.offset !== 0) isFirst = false
    }
    if (end) {
      let itemId = end.path[0]
      let itemPos = node.getItemPosition(itemId)
      let item = doc.get(itemId)
      if (itemPos < node.items.length-1 || end.offset < item.getLength()) isLast = false
    }
  }
  let isEntirelySelected = isFirst && isLast
  return {isFirst, isLast, isEntirelySelected}
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
      // NOTE: ATM we mostly use 'full' NodeSelections
      // Still, they are supported internally
      // mode: mode
    })
  }
}

export function selectNode(tx, nodeId, containerId) {
  tx.setSelection(createNodeSelection({ doc: tx, nodeId, containerId }))
}

export function createNodeSelection({ doc, nodeId, containerId, mode, reverse, surfaceId}) {
  let node = doc.get(nodeId)
  if (!node) return Selection.nullSelection
  node = node.getRoot()
  if (node.isText()) {
    return new PropertySelection({
      path: node.getTextPath(),
      startOffset: mode === 'after' ? node.getLength() : 0,
      endOffset: mode === 'before' ? 0 : node.getLength(),
      reverse: reverse,
      containerId: containerId,
      surfaceId: surfaceId
    })
  } else if (node.isList() && node.getLength()>0) {
    let first = node.getFirstItem()
    let last = node.getLastItem()
    let start = {
      path: first.getTextPath(),
      offset: 0
    }
    let end = {
      path: last.getTextPath(),
      offset: last.getLength()
    }
    if (mode === 'after') start = end
    else if (mode === 'before') end = start
    return new ContainerSelection({
      startPath: start.path,
      startOffset: start.offset,
      endPath: end.path,
      endOffset: end.offset,
      reverse: reverse,
      containerId: containerId,
      surfaceId: surfaceId
    })
  } else {
    return new NodeSelection({ nodeId, mode, reverse, containerId, surfaceId })
  }
}

export function stepIntoIsolatedNode(editorSession, comp) {
  // this succeeds if the content component provides
  // a grabFocus() implementation
  if (comp.grabFocus()) return true

  // otherwise we try to find the first surface
  let surface = comp.find('.sc-surface')
  if (surface) {
    if (surface._isTextPropertyEditor) {
      const doc = editorSession.getDocument()
      const path = surface.getPath()
      const text = doc.get(path, 'strict')
      editorSession.setSelection({
        type: 'property',
        path: path,
        startOffset: text.length,
        surfaceId: surface.id
      })
      return true
    } else if (surface._isContainerEditor) {
      let container = surface.getContainer()
      if (container.length > 0) {
        let first = container.getChildAt(0)
        setCursor(editorSession, first, container.id, 'after')
      }
      return true
    }
  }
  return false
}
