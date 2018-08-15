import AnnotationMixin from '../model/AnnotationMixin'
import XMLDocumentNode from './XMLDocumentNode'
import * as xmlNodeHelpers from './xmlNodeHelpers'

export default class XMLInlineElementNode extends AnnotationMixin(XMLDocumentNode) {
  /*
    Note: InlineElements can be used in structured context,
    If path is specified, parent is implicitly given.
    Otherwise it is set explictly by ParentNodeHook.
  */
  get parentNode () {
    const path = this.start.path
    if (path[0]) {
      const doc = this.getDocument()
      return doc.get(path[0])
    }
    return this._parentNode
  }

  set parentNode (parent) {
    const path = this.start.path
    if (path[0]) {
      throw new Error('parent of inline-element is implicitly given')
    }
    this._parentNode = parent
  }

  getChildAt (idx) {
    return xmlNodeHelpers.getChildAt(this, idx)
  }

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

  getInnerXML () {
    return this.getChildren().map(child => {
      return child.toXML().outerHTML
    }).join('')
  }

  static isInlineNode () { return true }

  get _elementType () { return 'inline-element' }

  // this is used at some other places (DragManager, DOMExporter, Editing, AnnotatedTextComponent, xmlNodeHelpers)
  // TODO: get rid of this by using `node.isInlineNode()` or `NodeClass.isInlineNode()`
  get _isInlineNode () { return true }
}

XMLInlineElementNode.schema = {
  // TODO: use '@inline-element'
  type: 'inline-element',
  _childNodes: { type: ['array', 'id'], default: [], owned: true }
}
