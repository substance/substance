import { InlineNode } from 'substance'

export default class TestInlineNode extends InlineNode {}

TestInlineNode.schema = {
  type: 'test-inline-node',
  content: 'text'
}
