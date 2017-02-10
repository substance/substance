import PropertyAnnotation from './PropertyAnnotation'

class InlineNode extends PropertyAnnotation {}

InlineNode.prototype._isInlineNode = true

InlineNode.isInline = true

export default InlineNode
