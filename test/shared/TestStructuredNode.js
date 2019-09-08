import { DocumentNode, TEXT, CONTAINER } from 'substance'
import { ANNOS_AND_INLINE_NODES, ANNOS } from './TestArticleConstants'

export default class StructuredNode extends DocumentNode {
  define () {
    return {
      type: 'structured-node',
      title: TEXT(ANNOS),
      body: CONTAINER({ nodeTypes: ['paragraph'], defaultTextType: 'paragraph' }),
      caption: TEXT(ANNOS_AND_INLINE_NODES)
    }
  }
}
