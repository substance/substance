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

  // appendChild(child) {
  //   this.insertAt(this._childNodes.length, child)
  // }

  // removeChild(child) {
  //   const childId = child.id
  //   const childPos = this._childNodes.indexOf(childId)
  //   if (childPos >= 0) {
  //     this.removeAt(childPos)
  //   } else {
  //     throw new Error(`node ${childId} is not a child of ${this.id}`)
  //   }
  //   return this
  // }
  //
  // insertBefore(newChild, ref) {
  //   if (!ref) {
  //     this.appendChild(newChild)
  //   } else {
  //     let pos = this._childNodes.indexOf(ref.id)
  //     if (pos < 0) {
  //       throw new Error('Given node is not a child.')
  //     }
  //     this.insertAt(pos, newChild)
  //   }
  // }

  // insertAt(pos, child) {
  //   const length = this._childNodes.length
  //   if (pos >= 0 && pos <= length) {
  //     const doc = this.getDocument()
  //     doc.update([this.id, '_childNodes'], { type: 'insert', pos, value: child.id })
  //   } else {
  //     throw new Error('Index out of bounds.')
  //   }
  //   return this
  // }

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
