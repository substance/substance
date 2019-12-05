import { $$ } from '../dom'
import AffiliationModal from './AffiliationModal'
import ItemCommand from './_ItemCommand'

export default class EditAffiliationCommand extends ItemCommand {
  getType () {
    return 'affiliation'
  }

  execute (params, context) {
    const commandState = params.commandState
    const node = commandState.node
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(AffiliationModal, { mode: 'edit', node })
    }).then(modal => {
      if (!modal) return
      context.api.updateAffiliation(node.id, modal.state.data)
    })
  }
}
