import Component from '../../ui/Component'
import ListItemComponent from './ListItemComponent'

class ListComponent extends Component {

  constructor(...args) {
    super(...args)
  }

  render($$) {
    let node = this.props.node
    let el = $$(this._getTagName()).addClass('sc-list').attr('data-id', node.id)
    node.getItems().forEach(function(item, idx) {
      el.append(
        $$(ListItemComponent, {
          path: [node.id, 'items', idx, 'content'],
          node: item,
          tagName: 'li'
        }).ref(node.id)
      )
    })
    return el
  }

  didMount() {
    this.context.editorSession.onRender('document', this.rerender, this, {
      path: [this.props.node.id, 'items']
    })
  }

  _getTagName() {
    return this.props.node.ordered ? 'ol' : 'ul'
  }

}

// we need this ATM to prevent this being wrapped into an isolated node (see ContainerEditor._renderNode())
ListComponent.prototype._isCustomNodeComponent = true

export default ListComponent
