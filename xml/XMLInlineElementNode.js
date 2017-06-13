import XMLAnnotationNode from './XMLAnnotationNode'

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

}

XMLInlineElementNode.prototype._elementType = 'inline-element'

// TODO: figure out which of these flags are really necessary
// and try to stream-line
XMLInlineElementNode.prototype._isInlineNode = true
XMLInlineElementNode.isInline = true


XMLInlineElementNode.type = 'inline-element'

XMLInlineElementNode.schema = {
  childNodes: { type: ['array', 'id'], default: [], owned: true},
}
