import { ListMixin, DocumentNode, CHILDREN, STRING } from 'substance'

export default class TestList extends ListMixin(DocumentNode) {
  createListItem (text) {
    let item = this.getDocument().create({ type: 'list-item', content: text, level: 1 })
    return item
  }

  getItemsPath () {
    return [this.id, 'items']
  }

  getListTypeString () {
    return this.listType
  }

  setListTypeString (listTypeStr) {
    this.listType = listTypeStr
  }

  define () {
    return {
      type: 'list',
      items: CHILDREN('list-item'),
      listType: STRING
    }
  }
}
