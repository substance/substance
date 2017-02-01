import DocumentNode from '../../model/DocumentNode'

class ListNode extends DocumentNode {

  getItemAt(idx) {
    return this.getDocument().get(this.items[idx])
  }

  getFirstItem() {
    return this.getItemAt(0)
  }

  getLastItem() {
    return this.getItemAt(this.getLength()-1)
  }

  getItems() {
    const doc = this.getDocument()
    return this.items.map((id) => {
      return doc.get(id)
    })
  }

  getItemPosition(itemId) {
    if (itemId._isNode) itemId = itemId.id
    let pos = this.items.indexOf(itemId)
    if (pos < 0) throw new Error('Item is not within this list: ' + itemId)
    return pos
  }

  insertItemAt(pos, itemId) {
    const doc = this.getDocument()
    doc.update([this.id, 'items'], { type: 'insert', pos: pos, value: itemId })
  }

  appendItem(itemId) {
    this.insertItemAt(this.items.length, itemId)
  }

  removeItemAt(pos) {
    const doc = this.getDocument()
    doc.update([this.id, 'items'], { type: 'delete', pos: pos })
  }

  remove(itemId) {
    const doc = this.getDocument()
    const pos = this.getItemPosition(itemId)
    if (pos >= 0) {
      doc.update([this.id, 'items'], { type: 'delete', pos: pos })
    }
  }

  getLength() {
    return this.items.length
  }

  get length() {
    return this.getLength()
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
