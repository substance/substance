import { $$, domHelpers } from '../dom'
import SelectableNodeComponent from './SelectableNodeComponent'
import { getLabel } from './nodeHelpers'

export default class AffiliationComponent extends SelectableNodeComponent {
  render () {
    // Note: using a button so that the browser treats it as UI element, not content (e.g. re selections)
    const el = $$('button', { class: 'sc-affiliation' })
    if (this.state.selected) el.addClass('sm-selected')

    el.append(
      this.renderContent()
    )

    el.on('mousedown', this._onMousedown)
    return el
  }

  renderLabel () {
    const node = this.props.node
    return $$('span', { class: 'se-label' }, getLabel(node))
  }

  renderContent () {
    const node = this.props.node
    const el = $$('span', { class: 'se-content' })
    el.append(
      $$('span', { class: 'se-name' }, node.name || '<No Name>')
    )
    if (node.city) {
      el.append(
        $$('span', { class: 'se-city' }, ', ', node.city)
      )
    }
    if (node.country) {
      el.append(
        $$('span', { class: 'se-country' }, ', ', node.country)
      )
    }
    return el
  }

  _onMousedown (e) {
    domHelpers.stopAndPrevent(e)
    this.send('selectItem', this.props.node)
  }
}
