import { InlineNode } from 'substance'

class TestInlineNode extends InlineNode {}

TestInlineNode.type = 'test-inline-node'

TestInlineNode.schema = {
  content: 'text'
}

export default TestInlineNode
