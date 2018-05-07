import DocumentNode from '../../model/DocumentNode'

export default
class ListNode extends DocumentNode {

  // specific implementation

  createListItem(text) {
    return this.getDocument().create( { type: 'list-item', content: text })
  }

  getItemAt(idx) {
    return this.getDocument().get(this.items[idx])
  }

  getItemPosition(item) {
    const id = item.id
    let pos = this.items.indexOf(id)
    if (pos < 0) throw new Error('Item is not within this list: ' + id)
    return pos
  }

  getItems() {
    const doc = this.getDocument()
    return this.items.map((id) => {
      return doc.get(id)
    })
  }

  getItemsPath() {
    return [this.id, 'items']
  }

  getLength() {
    return this.items.length
  }

  insertItemAt(pos, item) {
    const doc = this.getDocument()
    const id = item.id
    doc.update(this.getItemsPath(), { type: 'insert', pos: pos, value: id })
  }

  removeItemAt(pos) {
    const doc = this.getDocument()
    doc.update(this.getItemsPath(), { type: 'delete', pos: pos })
  }

  // general implementation (abstract)

  getFirstItem() {
    return this.getItemAt(0)
  }

  getLastItem() {
    return this.getItemAt(this.getLength()-1)
  }

  appendItem(item) {
    this.insertItemAt(this.items.length, item)
  }

  removeItem(item) {
    const pos = this.getItemPosition(item)
    if (pos >= 0) {
      this.removeItemAt(pos)
    }
  }

  isEmpty() {
    return this.getLength() === 0
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
  // this means, if the list gets deleted, the list items
  // will be deleted too
  items: { type: [ 'array', 'id' ], default: [], owned: true }
}
