import DOMElement from '../dom/DOMElement'
import XMLDocumentNode from './XMLDocumentNode'
import * as xmlNodeHelpers from './xmlNodeHelpers'

export default
class XMLElementNode extends XMLDocumentNode {
  appendChild (child) {
    return xmlNodeHelpers.appendChild(this, child)
  }

  removeChild (child) {
    return xmlNodeHelpers.removeChild(this, child)
  }

  insertBefore (newChild, ref) {
    return xmlNodeHelpers.insertBefore(this, newChild, ref)
  }

  insertAt (pos, child) {
    return xmlNodeHelpers.insertAt(this, pos, child)
  }

  removeAt (pos) {
    return xmlNodeHelpers.removeAt(this, pos)
  }

  getChildAt (idx) {
    return xmlNodeHelpers.getChildAt(this, idx)
  }

  isElementNode () {
    return true
  }

  append () {
    return DOMElement.prototype.append.apply(this, arguments)
  }

  replaceChild (oldChild, newChild) {
    return xmlNodeHelpers.replaceChild(this, oldChild, newChild)
  }

  get _elementType () { return 'element' }

  static isBlock () { return true }
}

XMLElementNode.schema = {
  type: 'element',
  _childNodes: { type: ['array', 'id'], default: [], owned: true }
}
