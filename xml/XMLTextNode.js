import { TextNodeMixin } from '../model'
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

}

XMLTextNode.prototype._elementType = 'text'

XMLTextNode.isText = true
XMLTextNode.isBlock = true

XMLTextNode.type = 'text'

XMLTextNode.schema = {
  content: "text"
}
