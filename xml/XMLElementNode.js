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

  removeChild(child) {
    const childId = child.id
    const childPos = this._childNodes.indexOf(childId)
    if (childPos >= 0) {
      this.removeAt(childPos)
    } else {
      throw new Error(`node ${childId} is not a child of ${this.id}`)
    }
    return this
  }

  insertAt(pos, child) {
    const length = this._childNodes.length
    if (pos >= 0 && pos <= length) {
      const doc = this.getDocument()
      doc.update([this.id, 'childNodes'], { type: 'insert', pos, value: child.id })
    } else {
      throw new Error('Index out of bounds.')
    }
    return this
  }

  removeAt(pos) {
    const length = this._childNodes.length
    if (pos >= 0 && pos < length) {
      const doc = this.getDocument()
      doc.update([this.id, 'childNodes'], { type: 'delete', pos: pos })
    } else {
      throw new Error('Index out of bounds.')
    }
    return this
  }

  getInnerXML() {
    return this.getChildren().map((child) => {
      return child.toXML().outerHTML
    }).join('')
  }

  isElementNode() {
    return true
  }

  // TODO: implement as much of DOMElement as possible

}

XMLElementNode.prototype.append = DOMElement.prototype.append

XMLElementNode.prototype._elementType = 'element'

XMLElementNode.type = 'element'

XMLElementNode.schema = {
  _childNodes: { type: ['array', 'id'], default: [], owned: true}
}

XMLElementNode.isBlock = true
