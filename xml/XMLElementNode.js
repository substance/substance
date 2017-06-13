import XMLDocumentNode from './XMLDocumentNode'

export default
class XMLElementNode extends XMLDocumentNode {}

XMLElementNode.prototype._elementType = 'element'

XMLElementNode.type = 'element'

XMLElementNode.schema = {
  childNodes: { type: ['array', 'id'], default: [], owned: true}
}

XMLElementNode.isBlock = true