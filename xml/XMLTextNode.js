import { DocumentNode, TextNodeMixin } from '../model'
import node2element from './node2element'

/*
  Note: this is slightly different to Substance TextNode
  thus this does not extend Substance.TextNode.
*/
export default class TextNode extends TextNodeMixin(DocumentNode) {

  getPath() {
    return [this.id, 'content']
  }

  getText() {
    return this.content
  }

  toXML() {
    return node2element(this)
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

TextNode.prototype._elementType = 'text'

TextNode.isText = true
TextNode.isBlock = true


TextNode.type = 'text'

TextNode.schema = {
  attributes: { type: 'object', default: {} },
  content: "text"
}
