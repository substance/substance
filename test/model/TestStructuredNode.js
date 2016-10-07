import DocumentNode from '../../model/DocumentNode'

class StructuredNode extends DocumentNode {}

StructuredNode.define({
  type: "structured-node",
  title: "text",
  body: "text",
  caption: "text"
})

StructuredNode.isBlock = true

export default StructuredNode
