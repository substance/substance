import DocumentNode from './DocumentNode'

/**
  A base class for all text-ish nodes, such as Paragraphs, Headings,
  Prerendered, etc.
*/
class TextNode extends DocumentNode {

  getTextPath() {
    return [this.id, 'content']
  }

  getText() {
    return this.content
  }

  isEmpty() {
    return !this.content
  }

}

TextNode.isText = true

TextNode.schema = {
  type: "text",
  content: "text",
  direction: { type: "string", optional: true }
}

export default TextNode
