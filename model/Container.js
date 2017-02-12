import isNumber from '../util/isNumber'
import isString from '../util/isString'
import DocumentNode from './DocumentNode'
import ContainerAddress from './ContainerAddress'

/*
  A Container represents a list of nodes.

  While most editing occurs on a property level (such as editing text),
  other things happen on a node level, e.g., breaking or mergin nodes,
  or spanning annotations so called ContainerAnnotations.
*/
class Container extends DocumentNode {

  constructor(...args) {
    super(...args)

    // NOTE: we are caching positions as they are queried very often,
    // whereas the number of changes to a container are quite rare.
    // The cache gets invalidated whenever the container is changed.
    this._enableCaching()
  }

  dispose() {
    this.document.off(this)
  }

  getContentPath() {
    return [this.id, 'nodes']
  }

  getContent() {
    return this.nodes
  }

  getPosition(node, strict) {
    if (isString(node)) {
      node = this.document.get(node)
    }
    let pos = this._getPosition(node)
    if (strict && pos < 0) {
      throw new Error('Node is not within this container: ' + node.id)
    }
    return pos
  }

  getNodeAt(idx) {
    let content = this.getContent()
    if (idx < 0 || idx >= content.length) {
      throw new Error('Array index out of bounds: ' + idx + ", " + content.length)
    }
    return this.getDocument().get(content[idx])
  }

  getNodes() {
    const doc = this.getDocument()
    return this.getContent().map(id => doc.get(id)).filter(Boolean)
  }

  show(nodeId, pos) {
    var doc = this.getDocument()
    var arg1 = arguments[0]
    if (!isString(arg1)) {
      if (arg1._isNode) {
        nodeId = arg1.id
      }
    }
    if (!isNumber(pos)) {
      pos = this.getLength()
    }
    doc.update(this.getContentPath(), { type: 'insert', pos: pos, value: nodeId })
  }

  hide(nodeId) {
    var doc = this.getDocument()
    var pos = this.getPosition(nodeId)
    if (pos >= 0) {
      doc.update(this.getContentPath(), { type: 'delete', pos: pos })
    }
  }

  getAddress(coor) {
    if (!coor._isCoordinate) {
      // we have broken with an earlier version of this API
      throw new Error('Illegal argument: Container.getAddress(coor) expects a Coordinate instance.')
    }
    var nodeId = coor.path[0]
    var nodePos = this.getPosition(nodeId)
    var offset
    if (coor.isNodeCoordinate()) {
      if (coor.offset > 0) {
        offset = Number.MAX_VALUE
      } else {
        offset = 0
      }
    } else {
      offset = coor.offset
    }
    return new ContainerAddress(nodePos, offset)
  }

  getLength() {
    return this.getContent().length
  }

  get length() {
    return this.getLength()
  }

  _getPosition(node) {
    if (this._isCaching) {
      return this._getCachedPosition(node)
    } else {
      return this._lookupPosition(node)
    }
  }

  _getCachedPosition(node) {
    let cache = this._cachedPositions || this._fillCache()
    let nodeId = node.id
    let pos = -1
    if (cache.hasOwnProperty(nodeId)) {
      pos = cache[nodeId]
    } else {
      pos = this._lookupPosition(node)
      cache[nodeId] = pos
    }
    return pos
  }

  _fillCache() {
    let positions = {}
    this.nodes.forEach((id, pos) => {
      positions[id] = pos
    })
    this._cachedPositions = positions
    return positions
  }

  _invalidateCache() {
    this._cachedPositions = null
  }

  _lookupPosition(node) {
    if (node.hasParent()) {
      node = node.getRoot()
    }
    return this.getContent().indexOf(node.id)
  }

  _enableCaching() {
    // this hook is used to invalidate cached positions
    // caching is done only in the 'real' document, not in a TransactionDocument
    if (this.document) {
      this.document.data.on('operation:applied', this._onOperationApplied, this)
      this._isCaching = true
    }
  }

  _onOperationApplied(op) {
    if (op.type === 'set' || op.type === 'update') {
      if (op.path[0] === this.id) {
        this._invalidateCache()
      }
    }
  }

  _onDocumentChange(change) {
    if (change.isUpdated(this.getContentPath())) {
      this._invalidateCache()
    }
  }

  // NOTE: this has been in ParentNodeMixin before
  // TODO: try to get rid of this

  hasChildren() {
    return this.nodes.length > 0
  }

  getChildIndex(child) {
    return this.nodes.indexOf(child.id)
  }

  getChildren() {
    var doc = this.getDocument()
    var childrenIds = this.nodes
    return childrenIds.map(function(id) {
      return doc.get(id)
    })
  }

  getChildAt(idx) {
    var childrenIds = this.nodes
    if (idx < 0 || idx >= childrenIds.length) {
      throw new Error('Array index out of bounds: ' + idx + ", " + childrenIds.length)
    }
    return this.getDocument().get(childrenIds[idx])
  }

  getChildCount() {
    return this.nodes.length
  }

}

Container.prototype._isContainer = true

Container.schema = {
  type: 'container',
  nodes: { type: ['array', 'id'], default: [] }
}

export default Container
