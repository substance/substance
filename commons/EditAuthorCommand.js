import { $$ } from '../dom'
import AuthorModal from './AuthorModal'
import ItemCommand from './_ItemCommand'

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
      // TODO: considering collab we should do a more minimal update
      // i.e. using incremental changes
      const firstName = modal.refs.firstName.val()
      const lastName = modal.refs.lastName.val()
      let affiliations
      if (modal.refs.affiliations) {
        affiliations = modal.refs.affiliations.getSelectedValues()
      }
      context.api.updateNode(node.id, { firstName, lastName, affiliations })
    })
  }
}
