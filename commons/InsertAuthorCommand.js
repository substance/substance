import { $$ } from '../dom'
import AuthorModal from './AuthorModal'
import ItemCommand from './ItemCommand'

export default class InsertAuthorCommand extends ItemCommand {
  getType () {
    return 'author'
  }

  execute (params, context) {
    const { commandState } = params
    const editorSession = context.editorSession
    const document = editorSession.getDocument()
    context.editorSession.getRootComponent().send('requestModal', () => {
      return $$(AuthorModal, { mode: 'create', document })
    }).then(modal => {
      if (!modal) return
      const data = modal.state.data
      // turn affiliations into ids
      data.affiliations = data.affiliations.map(a => a.id)
      context.api.insertAuthor(data, commandState.node)
    })
  }
}
