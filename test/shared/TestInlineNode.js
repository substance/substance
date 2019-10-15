import { InlineNode, TEXT } from 'substance'
import { ANNOS_AND_INLINE_NODES } from './TestArticleConstants'

export default class TestInlineNode extends InlineNode {
  define () {
    return {
      type: 'test-inline-node',
      content: TEXT(ANNOS_AND_INLINE_NODES)
    }
  }
}
