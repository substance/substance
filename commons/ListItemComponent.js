import { Component, $$ } from '../dom'
import { renderProperty } from '../editor'

export default class ListItemComponent extends Component {
  render () {
    const el = $$('li').addClass('sc-list-item')
    el.append(
      renderProperty(this, this.props.node, 'content')
    )
    // for nested lists
    if (this.props.children) {
      el.append(this.props.children)
    }
    return el
  }
}
