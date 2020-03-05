import { $$ } from '../dom'
import PropertyComponent from './PropertyComponent'
import ReferenceComponent from './ReferenceComponent'

export default class ReferenceListComponent extends PropertyComponent {
  getPath () {
    return [this.props.document.root.id, 'references']
  }

  render () {
    const { document } = this.props
    const root = document.root
    const el = $$('div', { class: 'sc-reference-list' })
    if (root.references && root.references.length > 0) {
      const references = root.resolve('references')
      el.append(
        $$('h2', { level: 2 }, 'References')
          .setAttribute('data-section', 'references')
      )
      el.append(
        $$('div', { class: 'se-references' },
          ...references.map(refNode => {
            return $$(ReferenceComponent, { node: refNode }).ref(refNode.id)
          })
        )
      )
    }
    return el
  }
}
