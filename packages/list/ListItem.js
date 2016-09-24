import TextBlock from '../../model/TextBlock'

class ListItem extends TextBlock {}

ListItem.type = 'list-item'

ListItem.define({
  listType: { type: 'string', default: 'unordered' },
  level: { type: 'number', default: 1 }
})

export default ListItem
