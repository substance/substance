import { Container } from '../model'

export default class ContainerNode extends Container {

  getContentPath() {
    return [this.id, 'childNodes']
  }

  getContent() {
    return this.childNodes
  }

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

ContainerNode.prototype._elementType = 'container'

ContainerNode.type = 'container'

ContainerNode.schema = {
  attributes: { type: 'object', default: {} },
  childNodes: { type: ['array', 'id'], default: [], owned: true}
}

ContainerNode.isBlock = true