import { DocumentNode } from '../model'

export default
class AnchorNode extends DocumentNode {

  get path() {
    return this.coor.start.path
  }

  get parent() {
    const path = this.path
    const doc = this.getDocument()
    return doc.get(path[0])
  }

}

AnchorNode.prototype._elementType = 'anchor'

AnchorNode.type = 'anchor'

AnchorNode.schema = {
  attributes: { type: 'object', default: {} },
  coor: { type: "coordinate", optional: true }
}
