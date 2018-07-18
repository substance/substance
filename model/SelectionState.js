import Selection from './Selection'
import { getPropertyAnnotationsForSelection, getContainerAnnotationsForSelection, getMarkersForSelection } from './documentHelpers'
import { isFirst, isLast } from './selectionHelpers'

export default class SelectionState {
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
    if (sel.containerId) {
      let container = doc.get(sel.containerId)
      this.container = container
      let startId = sel.start.getNodeId()
      let endId = sel.end.getNodeId()
      let startNode = doc.get(startId).getContainerRoot()
      let startPos = container.getPosition(startNode)
      if (startPos > 0) {
        this.previousNode = container.getNodeAt(startPos - 1)
      }
      this.isFirst = isFirst(doc, sel.start)
      let endNode, endPos
      if (endId === startId) {
        endNode = startNode
        endPos = startPos
      } else {
        endNode = doc.get(endId).getContainerRoot()
        endPos = container.getPosition(endNode)
      }
      if (endPos < container.getLength() - 1) {
        this.nextNode = container.getNodeAt(endPos + 1)
      }
      this.isLast = isLast(doc, sel.end)
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
    if (propAnnos.length === 1 && propAnnos[0].isInline()) {
      this.isInlineNodeSelection = propAnnos[0].getSelection().equals(sel)
    }
    const containerId = sel.containerId
    if (containerId) {
      const containerAnnos = getContainerAnnotationsForSelection(doc, sel, containerId)
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
    this.container = null
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
