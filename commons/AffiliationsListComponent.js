import { Component, $$, domHelpers } from '../dom'
import { Blocker } from '../ui'
import SelectableNodeComponent from './SelectableNodeComponent'

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
        ...affiliations.map(affiliation => $$(_AffiliationComponent, { node: affiliation }).ref(affiliation.id))
      )
    } else {
      el.addClass('sm-empty')
    }

    return el
  }
}

class _AffiliationComponent extends SelectableNodeComponent {
  render () {
    const node = this.props.node
    // Note: using a button so that the browser treats it as UI element, not content (e.g. re selections)
    const el = $$('button', { class: 'sc-affiliation' })
    if (this.state.selected) el.addClass('sm-selected')

    el.append(
      $$('span', { class: 'se-name' }, node.name)
    )

    // add a blocker so that browser can not interact with the rendered content
    el.append($$(Blocker))

    el.on('mousedown', this._onMousedown)
    return el
  }

  _onMousedown (e) {
    domHelpers.stopAndPrevent(e)
    this.send('selectItem', this.props.node)
  }
}
