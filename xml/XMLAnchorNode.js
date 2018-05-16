import XMLDocumentNode from './XMLDocumentNode'

export default
class XMLAnchorNode extends XMLDocumentNode {
  /*
    The parent of an Annotation is implicitly given by its path.
  */
  get parentNode () {
    const path = this.coor.start.path
    const doc = this.getDocument()
    return doc.get(path[0])
  }
}

XMLAnchorNode.prototype._elementType = 'anchor'

XMLAnchorNode.type = 'anchor'

XMLAnchorNode.schema = {
  coor: { type: 'coordinate', optional: true }
}
