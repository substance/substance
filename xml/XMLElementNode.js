import { DOMElement } from '../dom'
import XMLDocumentNode from './XMLDocumentNode'

export default
class XMLElementNode extends XMLDocumentNode {

  appendChild(child) {
    let schema = this.getElementSchema()
    let pos = schema.findLastValidPos(this, child.type)
      // element can not be inserted without violating the schema
    if (pos < 0) {
      throw new Error(`'${child.type}' can not be inserted without violating the schema.`)
    }
    this.insertAt(pos, child)
  }

  insertAt(pos, child) {
    const doc = this.getDocument()
    doc.update([this.id, 'childNodes'], { type: 'insert', pos: pos, value: child.id })
  }

}

XMLElementNode.prototype.append = DOMElement.prototype.append

XMLElementNode.prototype._elementType = 'element'

XMLElementNode.type = 'element'

XMLElementNode.schema = {
  childNodes: { type: ['array', 'id'], default: [], owned: true}
}

XMLElementNode.isBlock = true