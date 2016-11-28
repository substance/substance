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

TextNode.define({
  type: "text",
  content: "text",
  direction: { type: "string", default: "ltr" }
})

export default TextNode
