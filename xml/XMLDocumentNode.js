import { DocumentNode, documentHelpers } from '../model'
import node2element from './node2element'
import cssSelect from '../vendor/css-select'
import cssSelectAdapter from './cssSelectAdapter'

export default
class XMLDocumentNode extends DocumentNode {

  _initialize(doc, props) {
    // Note: removing `id` from attributes here
    // because in Substance `id` plays a more important role
    // and is used as a property instead of an attribute.
    if (props.attributes) {
      delete props.attributes.id
    }
    super._initialize(doc, props)
  }

  toXML() {
    return node2element(this)
  }

  /*
    Find immediate child with a given tag name.

    TODO: discuss if this addition is helpful
    Note, that `find()` does not restrict the search on the first level
    Maybe we want to use a general CSS selector here
  */
  findChild(tagName) {
    const children = this.getChildren()
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (child.type === tagName) return child
    }
  }

  find(cssSelector) {
    return cssSelect.selectOne(cssSelector, this, { xmlMode: true, adapter: cssSelectAdapter })
  }

  findAll(cssSelector) {
    return cssSelect.selectAll(cssSelector, this, { xmlMode: true, adapter: cssSelectAdapter })
  }

  isContainer() {
    return false
  }

  /*
    A node is considered as a block-level element if it occurs on the first level
    of a container
  */
  isBlock() {
    const parentNode = this.parentNode
    return (parentNode && parentNode.isContainer())
  }

  getChildren() {
    if (this.childNodes) {
      return documentHelpers.getNodes(this.getDocument(), this.childNodes)
    } else {
      return []
    }
  }

  /*
    Used internally only, by cssSelectAdapter (aka customized DomUtils).
  */
  get parent() {
    return this.parentNode
  }

  setAttribute(name, val) {
    if (name === 'id') {
      throw new Error("'id' is read-only and can not be changed")
    }
    this.getDocument().set([this.id, 'attributes', name], val)
  }

  getAttribute(name) {
    if (name === 'id') return this.id
    return this.attributes[name]
  }

}

XMLDocumentNode.schema = {
  attributes: { type: 'object', default: {} }
}