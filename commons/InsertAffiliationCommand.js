import { $$ } from '../dom'
import AffiliationModal from './AffiliationModal'
import ItemCommand from './ItemCommand'

export default class InsertAffiliationCommand extends ItemCommand {
  getType () {
    return 'affiliation'
  }

  execute (params, context) {
    const { commandState } = params
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(AffiliationModal, { mode: 'create' })
    }).then(modal => {
      if (!modal) return
      context.api.insertAffiliation(modal.state.data, commandState.node)
    })
  }
}
