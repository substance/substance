import { TextNode, TEXT } from 'substance'
import { ANNOS_AND_INLINE_NODES } from './TestArticleConstants'

export default class Paragraph extends TextNode {
  define () {
    return {
      type: 'paragraph',
      content: TEXT(ANNOS_AND_INLINE_NODES)
    }
  }
}
