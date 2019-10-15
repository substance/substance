import { Container, CONTAINER } from 'substance'
import { BLOCK_NODES } from './TestArticleConstants'

export default class TestBody extends Container {
  define () {
    return {
      type: 'body',
      nodes: CONTAINER({
        nodeTypes: BLOCK_NODES,
        defaultTextType: 'paragraph'
      })
    }
  }
}
