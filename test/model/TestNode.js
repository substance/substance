import DocumentNode from '../../model/DocumentNode'

class TestNode extends DocumentNode {}

TestNode.schema = {
  type: "test-node",
  boolVal: { type: "boolean", default: false },
  stringVal: { type: "string", default: "" },
  arrayVal: { type: ["array","string"], default: [] },
  objectVal: { type: "object", default: {} },
}

TestNode.isBlock = true

export default TestNode
