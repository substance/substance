const MIN_LEVEL = 1
const MAX_LEVEL = 3

export default function ListItemMixin (TextNode) {
  class ListItem extends TextNode {
    getLevel () {
      return this.level
    }

    setLevel (newLevel) {
      const doc = this.getDocument()
      doc.set([this.id, 'level'], newLevel)
    }

    getPath () {
      return [this.id, 'content']
    }

    get canIndent () { return true }

    indent () {
      const level = this.level
      if (level < MAX_LEVEL) {
        this._changeLevel(1)
      }
    }

    get canDedent () { return true }

    dedent () {
      const level = this.level
      if (level > MIN_LEVEL) {
        this._changeLevel(-1)
      }
    }

    _changeLevel (delta) {
      this.setLevel(this.level + delta)
      // HACK: triggering parent explicitly
      // TODO: find a better solution
      this.getParent()._itemsChanged()
    }

    static isText () { return false }

    static isListItem () {
      return true
    }
  }
  return ListItem
}
