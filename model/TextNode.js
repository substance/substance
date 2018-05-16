import DocumentNode from './DocumentNode'
import TextNodeMixin from './TextNodeMixin'
/** A base class for all text-ish nodes, such as Paragraphs, Headings, Prerendered, etc.
*/
class TextNode extends TextNodeMixin(DocumentNode) {
  getPath () {
    return [this.id, 'content']
  }

  getText () {
    return this.content
  }
}

TextNode.isText = true

TextNode.schema = {
  type: 'text',
  content: 'text',
  direction: { type: 'string', optional: true },
  textAlign: { type: 'string', default: 'left' }
}

export default TextNode
