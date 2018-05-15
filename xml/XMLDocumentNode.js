import DocumentNode from '../model/DocumentNode'
import { getNodes } from '../model/documentHelpers'
import DOMElement from '../dom/DOMElement'
import clone from '../util/clone'
import last from '../util/last'
import ArrayIterator from '../util/ArrayIterator'
import { node2element, getInnerXML } from './xmlNodeHelpers'
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

  get children() {
    return this.getChildren()
  }

  getChildren() {
    // TODO: shouldn't we filter ElementNodes?
    return this.getChildNodes()
  }

  getChildNodes() {
    if (this._childNodes) {
      return getNodes(this.getDocument(), this._childNodes)
    } else {
      return []
    }
  }

  getChildCount() {
    if (this._childNodes) {
      return this._childNodes.length
    } else {
      return 0
    }
  }

  getChildPosition(child) {
    if (!child || !this._childNodes) return -1
    return this._childNodes.indexOf(child.id)
  }

  getChildNodeIterator() {
    return new ArrayIterator(this.getChildNodes())
  }

  getFirstChild() {
    if (this._childNodes) {
      return this.getDocument().get(this._childNodes[0])
    }
  }

  getLastChild() {
    if (this._childNodes) {
      return this.getDocument().get(last(this._childNodes))
    }
  }

  getParent() {
    return this.parentNode
  }

  get tagName() {
    return this.type
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
    return this
  }

  getAttribute(name) {
    if (name === 'id') return this.id
    return this.attributes[name]
  }

  removeAttribute(name) {
    if (this.attributes.hasOwnProperty(name)) {
      this.getDocument().set([this.id, 'attributes', name], undefined)
      delete this.attributes[name]
    }
    return this
  }

  getAttributes() {
    return clone(this.attributes)
  }

  getElementSchema() {
    return this.getDocument().getElementSchema(this.type)
  }

  serialize() {
    return this.toXML()
  }

  isTextNode() {
    return false
  }

  isElementNode() {
    return false
  }

  getInnerXML() {
    return getInnerXML(this)
  }

}

XMLDocumentNode.prototype.attr = DOMElement.prototype.attr

XMLDocumentNode.schema = {
  attributes: { type: 'object', default: {} }
}