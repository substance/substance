import { $$ } from '../dom'
import { Command } from '../editor'
import AffiliationModal from './AffiliationModal'

export default class AddAffiliationCommand extends Command {
  getCommandState () {
    return { disabled: false }
  }

  execute (params, context) {
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(AffiliationModal, { mode: 'create' })
    }).then(modal => {
      if (!modal) return
      const name = modal.refs.name.val()
      const api = context.api
      api.addNode([api.getRoot().id, 'affiliations'], { type: 'affiliation', name })
    })
  }
}
