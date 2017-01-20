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

ListNode.schema = {
  ordered: { type: 'boolean', default: false },
  // list-items are owned by the list
  items: { type: [ 'array', 'id' ], default: [], strong: true }
}

export default ListNode
