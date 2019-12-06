import { $$ } from '../dom'
import AuthorModal from './AuthorModal'
import ItemCommand from './ItemCommand'

export default class EditAuthorCommand extends ItemCommand {
  getType () {
    return 'author'
  }

  execute (params, context) {
    const editorSession = context.editorSession
    const document = editorSession.getDocument()
    const commandState = params.commandState
    const node = commandState.node
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(AuthorModal, { mode: 'edit', document, node })
    }).then(modal => {
      if (!modal) return
      const data = modal.state.data
      context.api.updateAuthor(node.id, data)
    })
  }
}
