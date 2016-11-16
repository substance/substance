import TextPropertyComponent from '../../ui/TextPropertyComponent'

class ListItemComponent extends TextPropertyComponent {

  getRealPath() {
    return this.props.node.getTextPath()
  }
}

export default ListItemComponent