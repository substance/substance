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
      const firstName = modal.refs.firstName.val()
      const lastName = modal.refs.lastName.val()
      let affiliations
      if (modal.refs.affiliations) {
        affiliations = modal.refs.affiliations.getSelectedValues()
      }
      const api = context.api
      api.addNode([api.getRoot().id, 'authors'], { type: 'author', firstName, lastName, affiliations })
    })
  }
}
