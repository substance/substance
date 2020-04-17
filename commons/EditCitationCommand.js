import { $$ } from '../dom'
import { Command } from '../editor'
import CitationModal from './CitationModal'

export default class EditCitationCommand extends Command {
  getCommandState (params, context) {
    return { disabled: false }
  }

  execute (params, context) {
    const editorSession = context.editorSession
    const document = editorSession.getDocument()
    const node = params.node
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(CitationModal, { mode: 'edit', document, node })
    }).then(modal => {
      if (!modal) return
      const data = { references: modal.state.selectedReferences.map(ref => ref.id) }
      context.api.updateCitation(node.id, data)
    })
  }
}
