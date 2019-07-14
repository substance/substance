import { flatten } from '../util'
import { DocumentChange } from '../model'
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

  dispose () {}

  commitChanges (options = {}) {
    // merge all changes into one big change
    let changes = this.getChanges()
    if (changes.length > 0) {
      let ops = flatten(changes.map(c => c.ops))
      let oldSel = this.parentEditorSession.getSelection()
      let newSel = options.selection || oldSel
      let mergedChange = new DocumentChange(ops, { selection: oldSel }, { selection: newSel })
      this.parentEditorSession.applyChange(mergedChange)
    }
  }
}
