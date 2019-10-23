import { $$ } from '../dom'
import { Command } from '../editor'
import AuthorModal from './AuthorModal'

export default class EditAuthorCommand extends Command {
  getCommandState (params) {
    const selectionState = params.selectionState
    if (selectionState.node && selectionState.node.type === 'author') {
      return { disabled: false, node: selectionState.node }
    }
    return { disabled: true }
  }

  execute (params, context) {
    const commandState = params.commandState
    const node = commandState.node
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(AuthorModal, { mode: 'edit', node })
    }).then(modal => {
      if (!modal) return
      // TODO: considering collab we should do a more minimal update
      // i.e. using incremental changes
      const firstName = modal.refs.firstName.val()
      const lastName = modal.refs.lastName.val()
      context.api.updateNode(node.id, { firstName, lastName })
    })
  }
}
