import { Component, $$ } from '../dom'
import AuthorComponent from './AuthorComponent'

export default class AuthorsListComponent extends Component {
  didMount () {
    const node = this.props.node
    this.context.editorState.addObserver(['document'], this.rerender, this, {
      document: {
        path: [node.id, 'authors']
      },
      stage: 'render'
    })
  }

  dispose () {
    this.context.editorState.off(this)
  }

  render () {
    const node = this.props.node
    const el = $$('div', { class: 'sc-authors-list' })

    const authors = node.resolve('authors')
    if (authors && authors.length > 0) {
      // Note: in the spirit to avoid unnecessary conventions we
      // do not dictate if authors are ordered
      el.append(
        ...authors.map(author => $$(AuthorComponent, { node: author }).ref(author.id))
      )
    } else {
      el.addClass('sm-empty')
    }

    return el
  }
}
