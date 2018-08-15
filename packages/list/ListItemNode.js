import TextNode from '../../model/TextNode'

export default class ListItem extends TextNode {
  getLevel () {
    return this.level
  }

  setLevel (newLevel) {
    if (this.level !== newLevel) {
      this.getDocument().set([this.id, 'level'], newLevel)
    }
  }

  static isListItem () {
    return true
  }
}

ListItem.schema = {
  type: 'list-item',
  level: { type: 'number', default: 1 }
}
