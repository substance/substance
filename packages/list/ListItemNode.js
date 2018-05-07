import TextNode from '../../model/TextNode'

export default class ListItem extends TextNode {

  getLevel() {
    return this.level
  }

  setLevel(newLevel) {
    if (this.level !== newLevel) {
      this.getDocument().set([this.id, 'level'], newLevel)
    }
  }
}

ListItem.type = 'list-item'

ListItem.schema = {
  level: { type: "number", default: 1 }
}
