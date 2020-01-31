import { $$, domHelpers } from '../dom'
import { renderProperty } from '../editor'
import SelectableNodeComponent from './SelectableNodeComponent'

export default class ReferenceComponent extends SelectableNodeComponent {
  render () {
    const { node } = this.props
    const document = node.getDocument()
    let { label } = node
    if (node && node.state) {
      label = node.state.label || label
    }
    const el = $$('div', { class: 'sc-reference', 'data-id': node.id })
    if (this.state.selected) el.addClass('sm-selected')

    el.append(
      $$('div', { class: 'se-label' }, label),
      renderProperty(this, document, [node.id, 'content'], { placeholder: 'Describe your reference' }).addClass('se-content')
    ).on('mousedown', this._onMousedown)

    return el
  }

  _onMousedown (e) {
    domHelpers.stopAndPrevent(e)
    this.send('selectItem', this.props.node)
  }
}
