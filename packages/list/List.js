import Container from '../../model/Container'

class List extends Container {
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

List.type = 'list'

List.define({
  ordered: { type: 'boolean', default: false },
  items: { type: [ 'array', 'id' ], default: [] }
})

// HACK: we don't want the inherited property 'nodes'
delete List.schema.nodes

export default List
