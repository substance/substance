import { $$ } from '../dom'
import { Command } from '../editor'
import AuthorModal from './AuthorModal'

export default class AddAuthorCommand extends Command {
  getCommandState () {
    return { disabled: false }
  }

  execute (params, context) {
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(AuthorModal, { mode: 'create' })
    }).then(modal => {
      if (!modal) return
      const firstName = modal.refs.firstName.val()
      const lastName = modal.refs.lastName.val()
      const api = context.api
      api.addNode([api.getRoot().id, 'authors'], { type: 'author', firstName, lastName })
    })
  }
}
