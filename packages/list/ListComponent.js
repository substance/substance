import isString from '../../util/isString'
import renderListNode from '../../util/renderListNode'
import NodeComponent from '../../ui/NodeComponent'
import ListItemComponent from './ListItemComponent'

export default class ListComponent extends NodeComponent {

  render($$) {
    let node = this.props.node
    let el = renderListNode(node, (item) => {
      // item is either a list item node, or a tagName
      if (isString(item)) {
        return $$(item)
      } else if(item.type === 'list-item') {
        let path = item.getPath()
        return $$(ListItemComponent, {
          path,
          node: item,
          tagName: 'li'
        }).ref(item.id)
      }
    })
    el.addClass('sc-list').attr('data-id', node.id)
    return el
  }
}

// we need this ATM to prevent this being wrapped into an isolated node (see ContainerEditor._renderNode())
ListComponent.prototype._isCustomNodeComponent = true
