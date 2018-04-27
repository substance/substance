import DOMElement from '../dom/DOMElement'
import XMLDocumentNode from './XMLDocumentNode'
import * as xmlNodeHelpers from './xmlNodeHelpers'

export default
class XMLElementNode extends XMLDocumentNode {

  appendChild(child) {
    return xmlNodeHelpers.appendChild(this, child)
  }

  removeChild(child) {
    return xmlNodeHelpers.removeChild(this, child)
  }

  insertBefore(newChild, ref) {
    return xmlNodeHelpers.insertBefore(this, newChild, ref)
  }

  insertAt(pos, child) {
    return xmlNodeHelpers.insertAt(this, pos, child)
  }

  removeAt(pos) {
    return xmlNodeHelpers.removeAt(this, pos)
  }

  getInnerXML() {
    xmlNodeHelpers.getInnerXML(this)
  }

  getChildAt(idx) {
    return xmlNodeHelpers.getChildAt(this, idx)
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
