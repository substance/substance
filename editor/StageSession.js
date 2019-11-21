import { flatten } from '../util'
import AbstractEditorSession from './AbstractEditorSession'

/**
 * Used as an EditorSession in Modals.
 *
 * It has capabilities to 'rebase' onto the latest
 */
export default class StageSession extends AbstractEditorSession {
  constructor (id, parentEditorSession, initialEditorState) {
    super(id, parentEditorSession.getDocument().clone(), initialEditorState)

    this.parentEditorSession = parentEditorSession

    // Once we start using this in a collaborative environment
    // we need to listen to changes applied to the parent session
  }

  commitChanges (options = {}) {
    // merge all changes into one big change
    const changes = this.getChanges()
    if (changes.length > 0) {
      const doc = this._document
      const ops = flatten(changes.map(c => c.ops))
      const oldSel = this.parentEditorSession.getSelection()
      const newSel = options.selection || oldSel
      const mergedChange = doc._createDocumentChange(ops, { selection: oldSel }, { selection: newSel })
      this.parentEditorSession.applyChange(mergedChange)
    }
  }
}
