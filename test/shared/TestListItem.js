import { DocumentNode, TextNodeMixin, TEXT } from 'substance'
import { ANNOS_AND_INLINE_NODES } from './TestArticleConstants'

const MIN_LEVEL = 1
const MAX_LEVEL = 3

export default class TestListItem extends TextNodeMixin(DocumentNode) {
  getLevel () {
    return this.level
  }

  setLevel (newLevel) {
    let doc = this.getDocument()
    doc.set([this.id, 'level'], newLevel)
  }

  getPath () {
    return [this.id, 'content']
  }

  get canIndent () { return true }

  indent () {
    let level = this.level
    if (level < MAX_LEVEL) {
      this._changeLevel(1)
    }
  }

  get canDedent () { return true }

  dedent () {
    let level = this.level
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

  static isListItem () {
    return true
  }

  define () {
    return {
      type: 'list-item',
      level: { type: 'number', default: 1 },
      content: TEXT(ANNOS_AND_INLINE_NODES)
    }
  }
}
