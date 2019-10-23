import { Command, AnnotationCommand } from '../editor'
import { $$ } from '../dom'
import LinkModal from './LinkModal'

export default class CreateLinkCommand extends Command {
  // TODO: GDocs enables the tool even if over a link
  // but not creating a new link, but opening the editor for the existing link
  getCommandState (params, context) {
    const sel = params.selection
    const selectionState = params.selectionState
    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      const links = selectionState.annosByType.get('link') || []
      if (AnnotationCommand.prototype.canCreate.call(this, links, sel, context)) {
        return { disabled: false }
      }
    }
    return { disabled: true }
  }

  execute (params, context) {
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(LinkModal, { mode: 'create' })
    }).then(modal => {
      if (!modal) return
      const href = modal.refs.href.val()
      context.api.insertAnnotation('link', { href })
    })
  }
}
