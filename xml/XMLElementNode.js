import DOMElement from '../dom/DOMElement'
import XMLDocumentNode from './XMLDocumentNode'
import xmlNodeHelpers from './xmlNodeHelpers'

export default
class XMLElementNode extends XMLDocumentNode {

  appendChild(child) {
    xmlNodeHelpers.appendChild(this, child)
  }

  removeChild(child) {
    xmlNodeHelpers.removeChild(this, child)
  }

  insertBefore(newChild, ref) {
    xmlNodeHelpers.insertBefore(this, newChild, ref)
  }

  insertAt(pos, child) {
    xmlNodeHelpers.insertAt(this, pos, child)
  }

  removeAt(pos) {
    xmlNodeHelpers.removeAt(this, pos)
  }

  getInnerXML() {
    xmlNodeHelpers.getInnerXML(this)
  }

  getChildAt(idx) {
    xmlNodeHelpers.getChildAt(this, idx)
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
