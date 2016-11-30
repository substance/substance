import Container from '../../model/Container'

class ListNode extends Container {
  getContentPath() {
    return [this.id, 'items']
  }
  getContent() {
    return this.items
  }
  getItems() {
    return this.getNodes()
  }
}

ListNode.type = 'list'

ListNode.define({
  ordered: { type: 'boolean', default: false },
  // list-items are owned by the list
  items: { type: [ 'array', 'id' ], default: [], strong: true }
})

// HACK: we don't want the inherited property 'nodes'
delete ListNode.schema.nodes

export default ListNode
