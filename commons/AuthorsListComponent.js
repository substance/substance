import { Component, $$, domHelpers } from '../dom'
import { Blocker } from '../ui'
import SelectableNodeComponent from './SelectableNodeComponent'
import { getLabel } from './nodeHelpers'

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
        ...authors.map(author => $$(_AuthorComponent, { node: author }).ref(author.id))
      )
    } else {
      el.addClass('sm-empty')
    }

    return el
  }
}

class _AuthorComponent extends SelectableNodeComponent {
  render () {
    const node = this.props.node
    // Note: using a button so that the browser treats it as UI element, not content (e.g. re selections)
    const el = $$('button', { class: 'sc-author' })
    if (this.state.selected) el.addClass('sm-selected')

    el.append(this.renderName(node))

    if (node.affiliations && node.affiliations.length > 0) {
      const affiliations = node.resolve('affiliations')
      const affLabels = affiliations.map(aff => getLabel(aff))
      affLabels.sort()
      el.append(
        $$('span', { class: 'se-affiliations' },
          ...affLabels.map(label => $$('span', { class: 'se-affiliation' }, label))
        )
      )
    }

    // add a blocker so that browser can not interact with the rendered content
    el.append($$(Blocker))

    el.on('mousedown', this._onMousedown)
    return el
  }

  renderName (node) {
    const el = $$('span', { class: 'se-name' })
    if (node.prefix) {
      el.append(
        $$('span', { class: 'se-prefix' }, node.prefix)
      )
    }
    if (node.firstName) {
      el.append(
        $$('span', { class: 'se-first-name' }, node.firstName)
      )
      if (node.middleNames && node.middleNames.length > 0) {
        for (const mn of node.middleNames) {
          el.append(
            $$('span', { class: 'se-middle-name' }, this._abbreviateName(mn))
          )
        }
      }
    }
    el.append(
      $$('span', { class: 'se-last-name' }, node.lastName)
    )
    if (node.suffix) {
      el.append($$('span', { class: 'se-suffix' }, node.suffix))
    }
    return el
  }

  _abbreviateName (name) {
    const frags = name.split('-')
    return frags.map(frag => {
      return frag.charAt(0).toUpperCase() + '.'
    }).join('-')
  }

  _onMousedown (e) {
    domHelpers.stopAndPrevent(e)
    this.send('selectItem', this.props.node)
  }
}
