import { Component } from '../dom'
import { isString, renderListNode } from '../util'

export default class ListComponent extends Component {
  didMount () {
    const editorState = this.context.editorState
    if (editorState) {
      editorState.addObserver(['document'], this.rerender, this, {
        stage: 'render',
        document: {
          path: [this.props.node.id]
        }
      })
    }
  }

  dispose () {
    const editorState = this.context.editorState
    if (editorState) {
      editorState.removeObserver(this)
    }
  }

  render ($$) {
    const ListItemComponent = this.getComponent('list-item')
    const node = this.props.node
    // TODO: this is a little obscure; maybe we can pull in the rendering logic here
    // for sake of transparency
    const el = renderListNode(node, item => {
      // item is either a list item node, or a tagName
      if (isString(item)) {
        return $$(item)
      } else if (item.type === 'list-item') {
        return $$(ListItemComponent, {
          node: item
        }).ref(item.id)
      }
    })
    el.addClass('sc-list').attr('data-id', node.id)
    return el
  }

  // we need this ATM to prevent this being wrapped into an isolated node (see ContainerEditor._renderNode())
  get _isCustomNodeComponent () { return true }
}
