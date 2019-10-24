import { ARABIC_NUMBERS } from './counters'

export default class AffiliationLabelManager {
  constructor (editorSession) {
    this.editorSession = editorSession

    const doc = this.editorSession.getDocument()
    this.editorSession.getEditorState().addObserver(['document'], this._onAffiliationsChange, this, {
      stage: 'update',
      document: {
        path: [doc.root.id, 'affiliations']
      }
    })
  }

  dispose () {
    this.editorSession.getEditorState().removeObserver(this)
  }

  _onAffiliationsChange () {
    const doc = this.editorSession.getDocument()
    const panels = doc.root.resolve('affiliations')
    const stateUpdates = []
    for (let idx = 0; idx < panels.length; idx++) {
      const panel = panels[idx]
      const label = String(ARABIC_NUMBERS[idx])
      stateUpdates.push([panel.id, { label }])
    }
    // HACK: also triggering an update of authors
    const authorIds = doc.root.authors || []
    for (const authorId of authorIds) {
      stateUpdates.push([authorId, {}])
    }

    // Note: do not propagatea here because we are already in a flow
    this.editorSession.updateNodeStates(stateUpdates, { silent: true, propagate: false })
  }
}
