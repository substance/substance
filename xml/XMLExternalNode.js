import { DocumentNode } from '../model'

export default
class ExternalNode extends DocumentNode {}

ExternalNode.prototype._elementType = 'external'

ExternalNode.type = 'external'

ExternalNode.schema = {
  attributes: { type: 'object', default: {} },
  xml: { type: 'string', default: ''}
}

ExternalNode.isBlock = true