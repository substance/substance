import { AnnotationCommand } from '../editor'
import { $$ } from '../dom'
import LinkModal from './LinkModal'

export default class InsertLinkCommand extends AnnotationCommand {
  executeCreate (params, context) {
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(LinkModal, { mode: 'create' })
    }).then(modal => {
      if (!modal) return
      const href = modal.refs.href.val()
      context.api.insertAnnotation('link', { href })
    })
  }
}
