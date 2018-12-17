import last from '../util/last'
import Selection from './Selection'
import PropertySelection from './PropertySelection'
import ContainerSelection from './ContainerSelection'
import NodeSelection from './NodeSelection'
import CustomSelection from './CustomSelection'
import getContainerRoot from './_getContainerRoot'
import getContainerPosition from './_getContainerPosition'

export function fromJSON (json) {
  if (!json) return Selection.nullSelection
  var type = json.type
  switch (type) {
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

/**
 * Helper to check if a coordinate is the first position of a node.
 * Attention: this works only for Text and List nodes
 */
export function isFirst (doc, containerPath, coor) {
  if (coor.isNodeCoordinate()) {
    return coor.offset === 0
  }
  let node = getContainerRoot(doc, containerPath, coor.path[0])
  if (node.isText()) {
    return coor.offset === 0
  }
  if (node.isList()) {
    let itemId = coor.path[0]
    return (node.items[0] === itemId && coor.offset === 0)
  }
  return false
}

/**
 * Helper to check if a coordinate is the last position of a node.
 * Attention: this works only for Text and List nodes
 */
export function isLast (doc, containerPath, coor) {
  if (coor.isNodeCoordinate()) {
    return coor.offset > 0
  }
  let node = getContainerRoot(doc, containerPath, coor.path[0])
  if (node.isText()) {
    return coor.offset >= node.getLength()
  }
  if (node.isList()) {
    let itemId = coor.path[0]
    let item = doc.get(itemId)
    return (last(node.items) === itemId && coor.offset === item.getLength())
  }
  return false
}

export function isEntirelySelected (doc, node, start, end) {
  let { isEntirelySelected } = getRangeInfo(doc, node, start, end)
  return isEntirelySelected
}

export function getRangeInfo (doc, node, start, end) {
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
      if (itemPos < node.items.length - 1 || end.offset < item.getLength()) isLast = false
    }
  }
  let isEntirelySelected = isFirst && isLast
  return {isFirst, isLast, isEntirelySelected}
}

export function setCursor (tx, node, containerPath, mode) {
  if (node.isText()) {
    let offset = 0
    if (mode === 'after') {
      let text = node.getText()
      offset = text.length
    }
    tx.setSelection({
      type: 'property',
      path: node.getPath(),
      startOffset: offset,
      containerPath
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
      path: item.getPath(),
      startOffset: offset,
      containerPath
    })
  } else {
    tx.setSelection({
      type: 'node',
      containerPath,
      nodeId: node.id
      // NOTE: ATM we mostly use 'full' NodeSelections
      // Still, they are supported internally
      // mode: mode
    })
  }
}

export function selectNode (tx, nodeId, containerPath) {
  tx.setSelection(createNodeSelection({ doc: tx, nodeId, containerPath }))
}

export function createNodeSelection ({ doc, nodeId, containerPath, mode, reverse, surfaceId }) {
  let node = doc.get(nodeId)
  if (!node) return Selection.nullSelection
  node = getContainerRoot(doc, containerPath, nodeId)
  if (node.isText()) {
    return new PropertySelection({
      path: node.getPath(),
      startOffset: mode === 'after' ? node.getLength() : 0,
      endOffset: mode === 'before' ? 0 : node.getLength(),
      reverse,
      containerPath,
      surfaceId
    })
  } else if (node.isList() && node.getLength() > 0) {
    let first = node.getFirstItem()
    let last = node.getLastItem()
    let start = {
      path: first.getPath(),
      offset: 0
    }
    let end = {
      path: last.getPath(),
      offset: last.getLength()
    }
    if (mode === 'after') start = end
    else if (mode === 'before') end = start
    return new ContainerSelection({
      startPath: start.path,
      startOffset: start.offset,
      endPath: end.path,
      endOffset: end.offset,
      reverse,
      containerPath,
      surfaceId
    })
  } else {
    return new NodeSelection({ nodeId, mode, reverse, containerPath, surfaceId })
  }
}

export function stepIntoIsolatedNode (editorSession, comp) {
  // this succeeds if the content component provides
  // a grabFocus() implementation
  if (comp.grabFocus()) return true

  // otherwise we try to find the first surface
  let surface = comp.find('.sc-surface')
  if (surface) {
    // TODO: what about CustomSurfaces?
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
      let doc = editorSession.getDocument()
      let containerPath = surface.getContainerPath()
      let nodeIds = doc.get()
      if (nodeIds.length > 0) {
        let first = doc.get(nodeIds[0])
        setCursor(editorSession, first, containerPath, 'after')
      }
      return true
    }
  }
  return false
}

export function augmentSelection (selData, oldSel) {
  // don't do magically if a surfaceId is present
  if (selData && oldSel && !selData.surfaceId && !oldSel.isNull()) {
    selData.containerPath = selData.containerPath || oldSel.containerPath
    selData.surfaceId = selData.surfaceId || oldSel.surfaceId
  }
  return selData
}

/**
 * Get the node ids covered by this selection.
 *
 * @returns {String[]} an getNodeIds of ids
 */
export function getNodeIdsCoveredByContainerSelection (doc, sel) {
  let containerPath = sel.containerPath
  let startPos = getContainerPosition(doc, containerPath, sel.start.path[0])
  let endPos = getContainerPosition(doc, containerPath, sel.end.path[0])
  let nodeIds = doc.get(containerPath)
  return nodeIds.slice(startPos, endPos + 1)
}
