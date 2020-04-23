import { $$ } from '../dom'
import { Command } from '../editor'
import AuthorModal from './AuthorModal'

export default class AddAuthorCommand extends Command {
  getCommandState () {
    return { disabled: false }
  }

  execute (params, context) {
    const editorSession = context.editorSession
    const document = editorSession.getDocument()
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(AuthorModal, { mode: 'create', document })
    }).then(modal => {
      if (!modal) return
      const data = modal.state.data
      // ATTENTION: we have to map to ids here
      data.affiliations = data.affiliations.map(a => a.id)
      context.api.addAuthor(data)
    })
  }
}
