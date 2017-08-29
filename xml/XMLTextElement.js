import { TextNodeMixin } from '../model'
import { DOMElement } from '../dom'
import XMLDocumentNode from './XMLDocumentNode'

/*
  Note: this is slightly different to Substance TextNode
  thus this does not extend Substance.TextNode.
*/
export default class XMLTextElement extends TextNodeMixin(XMLDocumentNode) {

  getPath() {
    return [this.id, '_content']
  }

  getText() {
    return this._content
  }

  /*
    This method is used for mimicking a DOM element.
    In our system, TextNodes are substantially different to common DOM elements
    as they only have plain-text, and overlaying annotations,
    i.e., annotations are not stored hierarchically.
  */
  getChildren() {
    const annos = this.getAnnotations()
    // sorting here by start.offset so that childNodes appear in natural order
    annos.sort(_byStartOffset)
    return annos
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

  appendChild(child) { // eslint-disable-line
    // TODO: children of TextNodes are special in our case.
    // A TextNode can only have annotations, inline-elements,
    // and anchors as children, which are implicitly bound
    // to the TextNode via their path property
    // I.e. an annotation is added in the old
    // way via doc.create(anno), and removed via doc.delete(anno.id)
    // Until further discussion, we leave this unimplemented
    throw new Error('This is not implemented yet.')
  }

  removeChild(child) { // eslint-disable-line
    // ditto
    throw new Error('This is not implemented yet.')
  }

  // regarding DOMElement API this is an ElementNode
  isElementNode() {
    return true
  }

}

XMLTextElement.prototype._isXMLTextElement = true

XMLTextElement.prototype.text = DOMElement.prototype.text

XMLTextElement.prototype._elementType = 'text'


XMLTextElement.isText = true
XMLTextElement.isBlock = true

XMLTextElement.type = 'text'

XMLTextElement.schema = {
  _content: "text"
}

function _byStartOffset(a,b) {
  return a.start.offset - b.start.offset
}