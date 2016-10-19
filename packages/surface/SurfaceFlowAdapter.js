import forEach from '../../util/forEach'

/*
  WILL BE REMOVED
*/
class SurfaceFlowAdapter {

  constructor(flow, documentSession) {
    this.flow = flow
    this.documentSession = documentSession
    const doc = documentSession.getDocument()
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
  }

  _onSelectionChange(data) {
    const state = this._state
    const oldSel = state.selection
    const newSel = data.selection
    // this._updateSelectionFragments(oldSel, newSel)
    state.selection = newSel
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
  }

  _updateSelectionFragments(oldSel, newSel, collaborator) {
    const state = this._state
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
        })
      }
      state.fragments[owner] = []
    }
    if (newSurfaceId) {
      // console.log('BBBBB feeding new selection fragments')
      const newFragments = _getFragmentsForSelection(newSel, collaborator)
      newFragments.forEach(function(frag) {
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
