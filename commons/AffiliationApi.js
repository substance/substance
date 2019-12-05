import { documentHelpers } from '../model'
import ApiExtension from './ApiExtension'

export default class AffiliationApi extends ApiExtension {
  /**
   * @param {object} data from AffiliationModal state
   */
  addAffiliation (data) {
    const root = this.api.getRoot()
    const nodeData = Object.assign({}, data, { type: 'affiliation' })
    this.api.addNode([root.id, 'affiliations'], nodeData)
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
