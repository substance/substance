import TreeIndex from '../util/TreeIndex'
import Selection from './Selection'
import documentHelpers from './documentHelpers'

class SelectionState {

  constructor(doc) {
    this.document = doc

    this.selection = Selection.nullSelection
    this._state = {}
    this._resetState()
  }

  setSelection(sel) {
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
    var state = this._state
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

  _deriveState(sel) {
    this._resetState()

    this._deriveAnnoState(sel)
    if (this.document.getIndex('markers')) {
      this._deriveMarkerState(sel)
    }
  }

  _deriveAnnoState(sel) {
    var doc = this.document
    var state = this._state

    // create a mapping by type for the currently selected annotations
    var annosByType = new TreeIndex.Arrays()
    var propAnnos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel)
    propAnnos.forEach(function(anno) {
      annosByType.add(anno.type, anno)
    })

    if (propAnnos.length === 1 && propAnnos[0].isInline()) {
      state.isInlineNodeSelection = propAnnos[0].getSelection().equals(sel)
    }

    var containerId = sel.containerId
    if (containerId) {
      var containerAnnos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, containerId)
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
      // flags to make node selection (IsolatedNodes) stuff more convenient
      isNodeSelection: false,
      nodeId: null,
      nodeSelectionMode: '', // full, before, after
      // flags for inline nodes
      isInlineNodeSelection: false
    }
    return this._state
  }
}

export default SelectionState
