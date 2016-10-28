import DocumentNode from '../../model/DocumentNode'

class List extends DocumentNode {}

List.type = 'list'

List.define({
  items: { type: [ 'array', 'id' ], default: [] }
})

export default List
