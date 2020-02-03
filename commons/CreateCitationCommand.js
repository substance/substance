import { AnnotationCommand } from '../editor'
import { $$ } from '../dom'
import CitationModal from './CitationModal'

export default class CreateCitationCommand extends AnnotationCommand {
  getCommandState (params, context) {
    const sel = params.selection
    const selectionState = params.selectionState
    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      const citations = selectionState.annosByType.get('cite') || []
      if (super.canCreate(citations, sel, context)) {
        return { disabled: false }
      }
    }
    return { disabled: true }
  }

  execute (params, context) {
    const editorSession = context.editorSession
    const document = editorSession.getDocument()

    editorSession.getRootComponent().send('requestModal', () => {
      return $$(CitationModal, { mode: 'create', document })
    }).then(modal => {
      if (!modal) return
      const target = modal.refs.references.val()
      context.api.insertAnnotation('cite', { target })
    })
  }
}
