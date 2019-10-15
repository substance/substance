import { TextNode, TEXT } from 'substance'
import { ANNOS_AND_INLINE_NODES } from './TestArticleConstants'

export default class Preformat extends TextNode {
  define () {
    return {
      type: 'preformat',
      content: TEXT(ANNOS_AND_INLINE_NODES)
    }
  }
}
