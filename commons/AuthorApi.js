import { documentHelpers } from '../model'
import ApiExtension from './ApiExtension'

export default class AuthorApi extends ApiExtension {
  /**
   * @param {string} authorId
   * @param {object} data from AuthorModal.state.data
   */
  updateAuthor (authorId, data) {
    this.api.getEditorSession().transaction(tx => {
      documentHelpers.updateProperty(tx, [authorId, 'firstName'], data.firstName)
      documentHelpers.updateProperty(tx, [authorId, 'middleNames'], data.middleNames)
      documentHelpers.updateProperty(tx, [authorId, 'lastName'], data.lastName)
      documentHelpers.updateProperty(tx, [authorId, 'prefix'], data.prefix)
      documentHelpers.updateProperty(tx, [authorId, 'suffix'], data.suffix)
      documentHelpers.updateProperty(tx, [authorId, 'affiliations'], data.affiliations)
      this.api._selectItem(tx, tx.get(authorId))
    })
  }
}
