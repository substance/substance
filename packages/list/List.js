import DocumentNode from '../../model/DocumentNode'

class List extends DocumentNode {
  getItems() {
    let doc = this.getDocument()
    return this.items.map(function(id) {
      return doc.get(id)
    }).filter(Boolean)
  }
}

List.type = 'list'

List.define({
  ordered: { type: 'boolean', default: false },
  items: { type: [ 'array', 'id' ], default: [] }
})

export default List
