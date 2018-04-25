import XMLAnnotationNode from './XMLAnnotationNode'
import xmlNodeHelpers from './xmlNodeHelpers'

export default
class XMLInlineElementNode extends XMLAnnotationNode {

  /*
    Note: InlineElements can be used in structured context,
    If path is specified, parent is implicitly given.
    Otherwise it is set explictly by ParentNodeHook.
  */
  get parentNode() {
    const path = this.start.path
    if (path[0]) {
      const doc = this.getDocument()
      return doc.get(path[0])
    }
    return this._parentNode
  }

  set parentNode(parent) {
    const path = this.start.path
    if (path[0]) {
      throw new Error('parent of inline-element is implicitly given')
    }
    this._parentNode = parent
  }

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
    return this.getChildren().map(child => {
      return child.toXML().outerHTML
    }).join('')
  }

  getChildAt(idx) {
    xmlNodeHelpers.getChildAt(this, idx)
  }
}

XMLInlineElementNode.prototype._elementType = 'inline-element'

// TODO: figure out which of these flags are really necessary
// and try to stream-line
XMLInlineElementNode.prototype._isInlineNode = true
XMLInlineElementNode.isInline = true


XMLInlineElementNode.type = 'inline-element'

XMLInlineElementNode.schema = {
  _childNodes: { type: ['array', 'id'], default: [], owned: true},
}
