import { DocumentNode } from '../model'
import { cssSelect } from '../vendor/css-select'
import node2element from './node2element'
import cssSelectAdapter from './cssSelectAdapter'

export default
class ElementNode extends DocumentNode {

  /*
    Get child with given tag name
  */
  get(tagName) {
    const doc = this.getDocument()
    const childNodes = this.childNodes
    for (let i = 0; i < childNodes.length; i++) {
      const child = doc.get(childNodes[i])
      if (child.type === tagName) return child
    }
  }

  getChildren() {
    const doc = this.getDocument()
    return this.childNodes.map((id) => {
      return doc.get(id, 'strict')
    })
  }

  toXML() {
    return node2element(this)
  }

  find(cssSelector) {
    return cssSelect.selectOne(cssSelector, this, { xmlMode: true, adapter: cssSelectAdapter })
  }

  findAll(cssSelector) {
    return cssSelect.selectAll(cssSelector, this, { xmlMode: true, adapter: cssSelectAdapter })
  }

}

ElementNode.prototype._elementType = 'element'

ElementNode.type = 'element'

ElementNode.schema = {
  attributes: { type: 'object', default: {} },
  childNodes: { type: ['array', 'id'], default: [], owned: true}
}

ElementNode.isBlock = true