import DocumentNode from '../../model/DocumentNode'

class ListNode extends DocumentNode {

  getItemPath(id) {
    return [this.id, 'items', id, 'content']
  }

  getItems() {
    const doc = this.getDocument()
    return this.items.map((id) => {
      return doc.get(id)
    })
  }

  getItemIndex(id) {
    return this.items.indexOf(id)
  }

  insertAt(pos, itemId) {
    const doc = this.getDocument()
    doc.update([this.id, 'items'], { type: 'insert', pos: pos, value: itemId })
  }

  remove(itemId) {
    const doc = this.getDocument()
    const pos = this.getItemIndex(itemId)
    if (pos >= 0) {
      doc.update([this.id, 'items'], { type: 'delete', pos: pos })
    }
  }

}

ListNode.isList = true

ListNode.type = 'list'

ListNode.schema = {
  ordered: { type: 'boolean', default: false },
  // list-items are owned by the list
  items: { type: [ 'array', 'id' ], default: [], owned: true }
}

export default ListNode
