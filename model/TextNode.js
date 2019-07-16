import DocumentNode from './DocumentNode'
import TextNodeMixin from './TextNodeMixin'

/**
  A base class for all text-ish nodes, such as Paragraphs, Headings, Prerendered, etc.
*/
export default class TextNode extends TextNodeMixin(DocumentNode) {
  getPath () {
    return [this.id, 'content']
  }

  getText () {
    return this.content
  }

  static isText () { return true }
}

TextNode.schema = {
  type: 'text-node',
  content: 'text',
  direction: { type: 'enum', optional: true, values: ['left', 'right'] },
  textAlign: { type: 'enum', default: 'left', values: ['left', 'right'] }
}
