import { $$ } from '../dom'
import AffiliationComponent from './AffiliationComponent'
import PropertyComponent from './PropertyComponent'

export default class AffiliationsListComponent extends PropertyComponent {
  getPath () {
    return [this.props.node.id, 'affiliations']
  }

  render () {
    const node = this.props.node
    const affiliations = node.resolve('affiliations')
    const el = $$('div', { class: 'sc-affiliations-list' })
    if (affiliations && affiliations.length > 0) {
      el.append(
        ...affiliations.map(affiliation => $$(AffiliationComponent, { node: affiliation }).ref(affiliation.id))
      )
    } else {
      el.addClass('sm-empty')
    }
    return el
  }
}
