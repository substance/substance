import { TextNode, TEXT } from 'substance'
import { ANNOS_AND_INLINE_NODES } from './TestArticleConstants'

const MIN_LEVEL = 1
const MAX_LEVEL = 3

export default class Heading extends TextNode {
  get canIndent () { return true }

  indent () {
    let level = this.level
    if (level < MAX_LEVEL) {
      this.level = this.level + 1
    }
  }

  get canDedent () { return true }

  dedent () {
    let level = this.level
    if (level > MIN_LEVEL) {
      this.level = this.level - 1
    }
  }

  static get MIN_LEVEL () { return MIN_LEVEL }

  static get MAX_LEVEL () { return MAX_LEVEL }
}

Heading.schema = {
  type: 'heading',
  level: { type: 'number', default: 1 },
  content: TEXT(ANNOS_AND_INLINE_NODES)
}
