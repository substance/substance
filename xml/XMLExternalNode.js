import XMLDocumentNode from './XMLDocumentNode'

export default
class XMLExternalNode extends XMLDocumentNode {}

XMLExternalNode.prototype._elementType = 'external'

XMLExternalNode.type = 'external'

XMLExternalNode.schema = {
  xml: { type: 'string', default: '' }
}

XMLExternalNode.isBlock = true
