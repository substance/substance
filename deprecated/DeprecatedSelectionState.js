import Selection from '../model/Selection'
import {
  getPropertyAnnotationsForSelection, getContainerAnnotationsForSelection, getMarkersForSelection,
  getContainerRoot, getPreviousNode, getNextNode
} from '../model/documentHelpers'
import { isFirst, isLast } from '../model/selectionHelpers'

export default class DeprecatedSelectionState {
  constructor (doc) {
    this.document = doc
    this.selection = Selection.nullSelection

    this._reset()
  }

  getSelection () {
    return this.selection
  }

  setSelection (sel) {
    // printStacktrace()
    if (!sel) {
      sel = Selection.nullSelection
    } else {
      sel.attach(this.document)
    }
    this.selection = sel
    // TODO: selection state is selection plus derived state,
    // thus we need to return false only if both did not change
    this._deriveState(sel)
    return true
  }

  _deriveState (sel) {
    this._reset()

    this._deriveContainerSelectionState(sel)
    this._deriveAnnoState(sel)
    if (this.document.getIndex('markers')) {
      this._deriveMarkerState(sel)
    }
    // console.log('SelectionState:', this._state)
  }

  _deriveContainerSelectionState (sel) {
    let doc = this.document
    let containerPath = sel.containerPath
    if (containerPath) {
      let startId = sel.start.getNodeId()
      let endId = sel.end.getNodeId()
      let startNode = getContainerRoot(doc, containerPath, startId)
      let startPos = startNode.getXpath().pos
      if (startPos > 0) {
        this.previousNode = getPreviousNode(doc, containerPath, startPos)
      }
      this.isFirst = isFirst(doc, containerPath, sel.start)
      let endNode, endPos
      if (endId === startId) {
        endNode = startNode
        endPos = startPos
      } else {
        endNode = getContainerRoot(doc, containerPath, endId)
        endPos = endNode.getXpath().pos
      }
      this.nextNode = getNextNode(doc, containerPath, endPos)
      this.isLast = isLast(doc, containerPath, sel.end)
    }
  }

  _deriveAnnoState (sel) {
    const doc = this.document

    // create a mapping by type for the currently selected annotations
    let annosByType = {}
    function _add (anno) {
      if (!annosByType[anno.type]) {
        annosByType[anno.type] = []
      }
      annosByType[anno.type].push(anno)
    }
    const propAnnos = getPropertyAnnotationsForSelection(doc, sel)
    propAnnos.forEach(_add)
    if (propAnnos.length === 1 && propAnnos[0].isInlineNode()) {
      this.isInlineNodeSelection = propAnnos[0].getSelection().equals(sel)
    }
    const containerPath = sel.containerPath
    if (containerPath) {
      const containerAnnos = getContainerAnnotationsForSelection(doc, sel, containerPath)
      containerAnnos.forEach(_add)
    }
    this.annosByType = annosByType
  }

  _deriveMarkerState (sel) {
    const doc = this.document
    let markers = getMarkersForSelection(doc, sel)
    this.markers = markers
  }

  _reset () {
    // all annotations under the current selection
    this.annosByType = {}
    // markers under the current selection
    this.markers = null
    // flags for inline nodes
    this.isInlineNodeSelection = false
    // container information (only for ContainerSelection)
    this.previousNode = null
    this.nextNode = null
    // if the previous node is one char away
    this.isFirst = false
    // if the next node is one char away
    this.isLast = false
    // TODO: try to reduce them here
    // these are 'reduced' by AbstractIsolatedNodeComponent
    this.surface = null
    this.isolatedNodes = null
  }
}
