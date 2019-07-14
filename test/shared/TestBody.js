import { Container, CONTAINER } from 'substance'
import { BLOCK_NODES } from './TestArticleConstants'

export default class TestBody extends Container {}
TestBody.schema = {
  type: 'body',
  nodes: CONTAINER({
    nodeTypes: BLOCK_NODES,
    defaultTextType: 'paragraph'
  })
}
