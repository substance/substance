import { documentHelpers } from '../model'
import ApiExtension from './ApiExtension'

export default class AffiliationApi extends ApiExtension {
  /**
   * @param {object} data from AffiliationModal state
   */
  addAffiliation (data) {
    this.insertAffiliation(data)
  }

  insertAffiliation (data, currentAffiliation) {
    const editorSession = this.api.getEditorSession()
    const doc = editorSession.getDocument()
    const root = doc.root
    let insertPos = root.affiliations.length
    if (currentAffiliation) {
      insertPos = currentAffiliation.getPosition() + 1
    }
    const nodeData = Object.assign({}, data, { type: 'affiliation' })
    this.api.insertNode([root.id, 'affiliations'], insertPos, nodeData)
  }

  /**
   * @param {string} affId
   * @param {object} data from AffiliationModal state
   */
  updateAffiliation (affId, data) {
    this.api.getEditorSession().transaction(tx => {
      documentHelpers.updateProperty(tx, [affId, 'name'], data.name)
      documentHelpers.updateProperty(tx, [affId, 'city'], data.city)
      documentHelpers.updateProperty(tx, [affId, 'country'], data.country)
      this.api._selectItem(tx, tx.get(affId))
    })
  }
}
