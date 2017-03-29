import { DocumentNode } from 'substance'

class StructuredNode extends DocumentNode {}

StructuredNode.schema = {
  type: "structured-node",
  title: "text",
  body: "text",
  caption: "text"
}

StructuredNode.isBlock = true

export default StructuredNode
