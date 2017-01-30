import DocumentNode from '../../model/DocumentNode'

class TestMetaNode extends DocumentNode {}

TestMetaNode.schema = {
  type: 'meta',
  title: 'text'
}

export default TestMetaNode
