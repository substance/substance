import { DocumentNode } from 'substance'

export default class StructuredNode extends DocumentNode {
  static isBlock () { return true }
}

StructuredNode.schema = {
  type: 'structured-node',
  title: 'text',
  body: 'text',
  caption: 'text'
}
