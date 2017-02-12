import isString from '../../util/isString'
import Component from '../../ui/Component'
import ListItemComponent from './ListItemComponent'
import renderListNode from './renderListNode'
import getListTagName from './getListTagName'

class ListComponent extends Component {

  didMount() {
    this.context.editorSession.onRender('document', this._onChange, this)
  }

  render($$) {
    let node = this.props.node
    let el = $$(getListTagName(node))
      .addClass('sc-list')
      .attr('data-id', node.id)
    renderListNode(node, el, (arg) => {
      if (isString(arg)) {
        return $$(arg)
      } else if(arg.type === 'list-item') {
        let item = arg
        return $$(ListItemComponent, {
          path: [item.id, 'content'],
          node: item,
          tagName: 'li'
        })
        // setting ref to preserve items when rerendering
        .ref(item.id)
      }
    })
    return el
  }

  _onChange(change) {
    const node = this.props.node
    if (change.isAffected(node.id)) {
      return this.rerender()
    }
    // check if any of the list items are affected
    let itemIds = node.items
    for (let i = 0; i < itemIds.length; i++) {
      if (change.isAffected([itemIds[i], 'level'])) {
        return this.rerender()
      }
    }
  }

}

// we need this ATM to prevent this being wrapped into an isolated node (see ContainerEditor._renderNode())
ListComponent.prototype._isCustomNodeComponent = true

export default ListComponent
