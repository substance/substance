import { TextNodeMixin } from '../model'
import { DOMElement } from '../dom'
import XMLDocumentNode from './XMLDocumentNode'

/*
  Note: this is slightly different to Substance TextNode
  thus this does not extend Substance.TextNode.
*/
export default class XMLTextNode extends TextNodeMixin(XMLDocumentNode) {

  getPath() {
    return [this.id, 'content']
  }

  getText() {
    return this.content
  }

  /*
    This method is used for mimicking a DOM element.
    In our system, TextNodes are substantially different to common DOM elements
    as they only have plain-text, and overlaying annotations,
    i.e., annotations are not stored hierarchically.
  */
  getChildren() {
    return this.getAnnotations()
  }

  setText(text) {
    const doc = this.getDocument()
    const path = this.getPath()
    const oldText = this.getText()
    // delete old text first
    if (oldText.length > 0) {
      doc.update(path, { type: 'delete', start: 0, end: oldText.length })
    }
    doc.update(path, { type: 'insert', start: 0, text })
    return this
  }

  // DOMElement API (partial)

  getTextContent() {
    return this.getText()
  }

  setTextContent(text) {
    return this.setText(text)
  }

  get textContent() {
    return this.getText()
  }

  set textContent(text) {
    this.setText(text)
  }

  appendChild(child) {
    // TODO: children of TextNodes are special in our case.
    // A TextNode can only have annotations, inline-elements,
    // and anchors as children, which are implicitly bound
    // to the TextNode via their path property
    // I.e. an annotation is added in the old
    // way via doc.create(anno), and removed via doc.delete(anno.id)
    // Until further discussion, we leave this unimplemented
    throw new Error('This is not implemented yet.')
  }

  removeChild(child) {
    // ditto
    throw new Error('This is not implemented yet.')
  }

}

XMLTextNode.prototype.text = DOMElement.prototype.text

XMLTextNode.prototype._elementType = 'text'

XMLTextNode.isText = true
XMLTextNode.isBlock = true

XMLTextNode.type = 'text'

XMLTextNode.schema = {
  content: "text"
}
