import { DocumentNode } from '../model'
import node2element from './node2element'

/*
  Note: this is slightly different to Substance TextNode
  thus this does not extend Substance.TextNode.
*/
export default class TextNode extends DocumentNode {

  getTextPath() {
    // TODO: deprecate this
    // console.warn('DEPRECATED: use node.getPath()')
    return this.getPath()
  }

  getPath() {
    return [this.id, 'content']
  }

  getText() {
    return this.content
  }

  isEmpty() {
    return !this.content
  }

  getLength() {
    return this.content.length
  }

  toXML() {
    return node2element(this)
  }

  getAnnotations() {
    return this.getDocument().getIndex('annotations').get(this.getPath())
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

TextNode.type = 'text'

TextNode.schema = {
  attributes: { type: 'object', default: {} },
  content: "text"
}