import Component from '../../ui/Component'
import TextPropertyComponent from '../../ui/TextPropertyComponent'

export default class ListItemComponent extends Component {
  render ($$) {
    const node = this.props.node
    const path = node.getPath()

    let el = $$('li').addClass('sc-list-item')
    el.append(
      $$(TextPropertyComponent, { path }).ref('text')
    )
    // for nested lists
    if (this.props.children) {
      el.append(this.props.children)
    }
    return el
  }
}
