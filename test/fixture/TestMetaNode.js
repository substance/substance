import { DocumentNode } from 'substance'

class TestMetaNode extends DocumentNode {}

TestMetaNode.schema = {
  type: 'meta',
  title: 'text'
}

export default TestMetaNode
