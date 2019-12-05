import { $$ } from '../dom'
import AuthorComponent from './AuthorComponent'
import PropertyComponent from './PropertyComponent'

export default class AuthorsListComponent extends PropertyComponent {
  getPath () {
    return [this.props.node.id, 'authors']
  }

  render () {
    const node = this.props.node
    const authors = node.resolve('authors')
    const el = $$('div', { class: 'sc-authors-list' })
    if (authors && authors.length > 0) {
      el.append(
        ...authors.map(author => $$(AuthorComponent, { node: author }).ref(author.id))
      )
    } else {
      el.addClass('sm-empty')
    }
    return el
  }
}
