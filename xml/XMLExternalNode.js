import XMLDocumentNode from './XMLDocumentNode'

export default class XMLExternalNode extends XMLDocumentNode {
  get _elementType () { return 'external' }

  static get isBlock () { return true }
}

XMLExternalNode.schema = {
  // TODO: use '@external' instead
  type: 'external',
  xml: { type: 'string', default: '' }
}
