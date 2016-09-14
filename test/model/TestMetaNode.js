import DocumentNode from '../../model/DocumentNode'

class TestMetaNode extends DocumentNode {}

TestMetaNode.define({
  type: 'meta',
  title: 'text'
})

export default TestMetaNode
