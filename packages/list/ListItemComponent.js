import Component from '../../ui/Component'
import TextProperty from '../../ui/TextPropertyComponent'

class ListItemComponent extends Component {

  render($$) {
    let node = this.props.node
    let el = $$('div')
      .addClass('sc-list-item')
      .addClass('sm-' + node.listType)
      .attr('data-id', this.props.node.id)
      .append($$(TextProperty, {
        path: [ this.props.node.id, 'content']
      })
    )
    return el
  }

}

export default ListItemComponent
