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

}

XMLTextNode.prototype.text = DOMElement.prototype.text

XMLTextNode.prototype._elementType = 'text'

XMLTextNode.isText = true
XMLTextNode.isBlock = true

XMLTextNode.type = 'text'

XMLTextNode.schema = {
  content: "text"
}
