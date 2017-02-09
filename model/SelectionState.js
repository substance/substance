import TreeIndex from '../util/TreeIndex'
import Selection from './Selection'
import documentHelpers from './documentHelpers'
import { isFirst, isLast } from './selectionHelpers'
// import printStacktrace from '../util/printStacktrace'

class SelectionState {

  constructor(doc) {
    this.document = doc

    this.selection = Selection.nullSelection
    this._state = {}
    this._resetState()
  }

  setSelection(sel) {
    // printStacktrace()
    if (!sel) {
      sel = Selection.nullSelection
    } else {
      sel.attach(this.document)
    }
    // TODO: selection state is selection plus derived state,
    // thus we need to return false only if both did not change
    this._deriveState(sel)
    this.selection = sel
    return true
  }

  getSelection() {
    return this.selection
  }

  getAnnotationsForType(type) {
    const state = this._state
    if (state.annosByType) {
      return state.annosByType.get(type) || []
    }
    return []
  }

  getMarkers() {
    // returns markers under the current selection
    return this._state.markers || []
  }

  isInlineNodeSelection() {
    return this._state.isInlineNodeSelection
  }

  getContainer() {
    return this._state.container
  }

  getPreviousNode() {
    return this._state.previousNode
  }

  getNextNode() {
    return this._state.nextNode
  }

  /*
    @returns if the previous node is one char away
  */
  isFirst() {
    return Boolean(this._state.isFirst)
  }

  /*
    @returns if the next node is one char away
  */
  isLast() {
    return Boolean(this._state.isLast)
  }

  get(key) {
    return this._state[key]
  }

  // used to store custom states (e.g. IsolatedNodeComponent uses this)
  set(key, value) {
    if (this._state[key]) {
      throw new Error(`State ${key} is already set`)
    }
    this._state[key] = value
  }

  _deriveState(sel) {
    this._resetState()
    this._deriveContainerSelectionState(sel)
    this._deriveAnnoState(sel)
    if (this.document.getIndex('markers')) {
      this._deriveMarkerState(sel)
    }
    // console.log('SelectionState:', this._state)
  }

  _deriveContainerSelectionState(sel) {
    let state = this._state
    let doc = this.document
    if (sel.containerId) {
      let container = doc.get(sel.containerId)
      state.container = container
      let startId = sel.start.getNodeId()
      let endId = sel.end.getNodeId()
      let startNode = doc.get(startId).getRoot()
      let startPos = container.getPosition(startNode)
      if (startPos > 0) {
        state.previousNode = container.getNodeAt(startPos-1)
      }
      state.isFirst = isFirst(doc, sel.start)
      let endNode, endPos
      if (endId === startId) {
        endNode = startNode
        endPos = startPos
      } else {
        endNode = doc.get(endId).getRoot()
        endPos = container.getPosition(endNode)
      }
      if (endPos < container.getLength()-1) {
        state.nextNode = container.getNodeAt(endPos+1)
      }
      state.isLast = isLast(doc, sel.end)
    }
  }

  _deriveAnnoState(sel) {
    const doc = this.document
    const state = this._state

    // create a mapping by type for the currently selected annotations
    let annosByType = new TreeIndex.Arrays()
    const propAnnos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel)
    propAnnos.forEach(function(anno) {
      annosByType.add(anno.type, anno)
    })

    if (propAnnos.length === 1 && propAnnos[0].isInline()) {
      state.isInlineNodeSelection = propAnnos[0].getSelection().equals(sel)
    }

    const containerId = sel.containerId
    if (containerId) {
      const containerAnnos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, containerId)
      containerAnnos.forEach(function(anno) {
        annosByType.add(anno.type, anno)
      })
    }
    state.annosByType = annosByType
  }

  _deriveMarkerState(sel) {
    const doc = this.document
    let state = this._state
    let markers = documentHelpers.getMarkersForSelection(doc, sel)
    state.markers = markers
  }

  _resetState() {
    this._state = {
      // all annotations under the current selection
      annosByType: null,
      // markers under the current selection
      markers: null,
      // flags for inline nodes
      isInlineNodeSelection: false,
      // container information (only for ContainerSelection)
      container: null,
      previousNode: null,
      nextNode: null,
      // if the previous node is one char away
      isFirst: false,
      // if the next node is one char away
      isLast: false
    }
    return this._state
  }
}

export default SelectionState
