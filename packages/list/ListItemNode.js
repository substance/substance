import TextNode from '../../model/TextNode'

class ListItem extends TextNode {}

ListItem.type = 'list-item'

ListItem.schema = {
  level: { type: "number", default: 1 }
}

export default ListItem
