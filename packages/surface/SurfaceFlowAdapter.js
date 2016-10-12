import forEach from '../../util/forEach'

/*
  Flow adapter that subscribes for selection and collaborators updates
  and feeds in surface level resources:

  - `[surface.id, 'selectionFragments']`: an object containing selection fragments grouped by user id / collaborator id
  - TODO: maybe we would like to have scoped selection events: `[surface.id, 'selection']`

*/
class SurfaceFlowAdapter {

  constructor(flow, documentSession) {
    this.flow = flow
    this.documentSession = documentSession

    const doc = documentSession.getDocument()
    flow.subscribe({
      stage: 'model',
      resources: {
        selection: [doc.id, 'selection']
      },
      handler: this._onSelectionChange,
      owner: this
    })
    flow.subscribe({
      stage: 'model',
      resources: {
        collaborators: [doc.id, 'collaborators']
      },
      handler: this._onCollaboratorsChange,
      owner: this
    })

    this._state = {
      selection: null,
      collaborators: {},
      // by name
      fragments: {},
    }

    this._isSelected = false
    this._selectionFragments = []
  }

  dispose() {
    this.flow.unsubscribe(this)
  }

  _onSelectionChange(data) {
    const state = this._state
    const oldSel = state.selection
    const newSel = data.selection
    // this._updateSelectionFragments(oldSel, newSel)
    state.selection = newSel
    // this.flow.start()
  }

  _onCollaboratorsChange(data) {
    const state = this._state
    const newCollaborators = data.collaborators
    forEach(newCollaborators, (collaborator, name) => {
      const newSel = collaborator.selection
      let oldSel = null
      if (state.collaborators[name]) {
        oldSel = state.collaborators[name].selection
      }
      this._updateSelectionFragments(oldSel, newSel, collaborator)
      state.collaborators[name] = collaborator
    })
    this.flow.start()
  }

  /*
    This feeds SelectionFragments into the flow.

    Fragments are inserted for every property
    Each fragment is inserted via id which of the following
    form: `<surface-id>,'selectionFragments', <property-path>`
  */
  _updateSelectionFragments(oldSel, newSel, collaborator) {
    const state = this._state
    const flow = this.flow
    // console.log('SurfaceManager: updating selection fragments', oldSel, newSel, collaborator);
    let oldSurfaceId = oldSel ? oldSel.surfaceId : null
    let newSurfaceId = newSel ? newSel.surfaceId : null
    let owner = 'local-user'
    if (collaborator) {
      owner = collaborator.collaboratorId
    }
    // clear old fragments
    if (oldSurfaceId) {
      const oldFragments = state.fragments[owner]
      if (oldFragments) {
        // console.log('AAAAA clearing old frags', oldFragments)
        oldFragments.forEach(function(frag) {
          flow.setValue([oldSurfaceId, 'selectionFragments', frag.path], owner, null)
        })
      }
      state.fragments[owner] = []
    }
    if (newSurfaceId) {
      // console.log('BBBBB feeding new selection fragments')
      const newFragments = _getFragmentsForSelection(newSel, collaborator)
      newFragments.forEach(function(frag) {
        flow.setValue([oldSurfaceId, 'selectionFragments', frag.path], owner, frag)
      })
      state.fragments[owner] = newFragments.slice(0)
    }
  }

}

// returns selection fragments with collaborator attached to each fragment
// as used by TextPropertyComponent
function _getFragmentsForSelection(sel, collaborator) {
  let frags = sel.getFragments()
  if (collaborator) {
    frags.forEach(function(frag) {
      frag.collaborator = collaborator
    })
  }
  return frags
}

SurfaceFlowAdapter.connect = function(flow, documentSession) {
  new SurfaceFlowAdapter(flow, documentSession)
}

export default SurfaceFlowAdapter
