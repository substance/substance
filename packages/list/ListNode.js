import DocumentNode from '../../model/DocumentNode'
import ListMixin from '../../model/ListMixin'

export default
class ListNode extends ListMixin(DocumentNode) {

  // specific implementation

  createListItem(text) {
    return this.getDocument().create( { type: 'list-item', content: text })
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

  insertItemAt(pos, item) {
    const doc = this.getDocument()
    const id = item.id
    doc.update(this.getItemsPath(), { type: 'insert', pos: pos, value: id })
  }

  removeItemAt(pos) {
    const doc = this.getDocument()
    doc.update(this.getItemsPath(), { type: 'delete', pos: pos })
  }

  // overridden

  getItemAt(idx) {
    return this.getDocument().get(this.items[idx])
  }

  getItemPosition(item) {
    const id = item.id
    let pos = this.items.indexOf(id)
    if (pos < 0) throw new Error('Item is not within this list: ' + id)
    return pos
  }

  getLength() {
    return this.items.length
  }

  getLevelTypes() {
    return super._getLevelTypes(this.listType)
  }

  _setLevelTypes(levelTypeStr) {
    this.getDocument().set([this.id, 'listType'], levelTypeStr)
  }

}

ListNode.type = 'list'

ListNode.schema = {
  // list-items are owned by the list
  // this means, if the list gets deleted, the list items
  // will be deleted too
  items: { type: [ 'array', 'id' ], default: [], owned: true },
  listType: { type: 'string', default: 'bullet' }
}
