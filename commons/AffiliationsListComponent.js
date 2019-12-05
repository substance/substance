import { Component, $$ } from '../dom'
import AffiliationComponent from './AffiliationComponent'

export default class AffiliationsListComponent extends Component {
  didMount () {
    const node = this.props.node
    this.context.editorState.addObserver(['document'], this.rerender, this, {
      document: {
        path: [node.id, 'affiliations']
      },
      stage: 'render'
    })
  }

  dispose () {
    this.context.editorState.off(this)
  }

  render () {
    const node = this.props.node
    const el = $$('div', { class: 'sc-affiliations-list' })

    const affiliations = node.resolve('affiliations')
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
