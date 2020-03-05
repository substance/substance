import { $$ } from '../dom'
import { Command } from '../editor'
import ReferenceModal from './ReferenceModal'

export default class AddReferenceCommand extends Command {
  getCommandState () {
    return { disabled: false }
  }

  execute (params, context) {
    const editorSession = context.editorSession
    const document = editorSession.getDocument()
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(ReferenceModal, { mode: 'create', document })
    }).then(modal => {
      if (!modal) return
      context.api.addReference(modal.state.data)
    })
  }
}
