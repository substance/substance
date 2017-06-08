import { InlineNode } from '../model'
import node2element from './node2element'

export default
class InlineElementNode extends InlineNode {

  /*
    Note: InlineElements can be used in structured context,
    If path is specified, parent is implicitly given.
    Otherwise it is set explictly by ParentNodeHook.
  */
  get parent() {
    const path = this.path
    if (path[0]) {
      const doc = this.getDocument()
      return doc.get(path[0])
    }
    return this._parent
  }

  set parent(parent) {
    const path = this.path
    if (path[0]) {
      throw new Error('parent of inline-element is implicitly given')
    }
    this._parent = parent
  }

  toXML() {
    return node2element(this)
  }

}

InlineElementNode.prototype._elementType = 'inline-element'

InlineElementNode.type = 'inline-element'

InlineElementNode.schema = {
  attributes: { type: 'object', default: {} },
  childNodes: { type: ['array', 'id'], default: [], owned: true},
}
