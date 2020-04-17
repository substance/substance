import { InsertInlineNodeCommand } from '../editor'
import { $$ } from '../dom'
import CitationModal from './CitationModal'

export default class CreateCitationCommand extends InsertInlineNodeCommand {
  getType () {
    return 'cite'
  }

  execute (params, context) {
    const editorSession = context.editorSession
    const document = editorSession.getDocument()

    editorSession.getRootComponent().send('requestModal', () => {
      return $$(CitationModal, { mode: 'create', document })
    }).then(modal => {
      if (!modal) return
      const data = { references: modal.state.selectedReferences.map(ref => ref.id) }
      context.api.insertInlineNode('cite', data)
    })
  }
}
