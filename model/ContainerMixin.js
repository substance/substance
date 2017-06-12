import { isNumber, isString } from '../util'
import ContainerAddress from './ContainerAddress'

export default function (SuperClass) {
  class ContainerMixin extends SuperClass {

    contains(nodeId) {
      return this.getPosition(nodeId) >= 0
    }

    getPosition(node, strict) {
      if (isString(node)) {
        node = this.document.get(node)
      }
      if (!node) return -1
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
      // allow to provide a node instance instead of nodeId
      const arg1 = arguments[0]
      if (!isString(arg1)) {
        if (arg1._isNode) {
          nodeId = arg1.id
        }
      }
      if (arguments.length > 1) {
        console.error('DEPRECATED: use container.showAt(pos, nodeId) instead')
      } else {
        pos = this.getLength()
      }
      return this.showAt(pos, nodeId)
    }

    showAt(pos, nodeId) {
      const doc = this.getDocument()
      const length = this.getLength()
      if (!isNumber(pos) || pos < 0 || pos > length) {
        throw new Error('Index out of bounds')
      }
      if (!isString(nodeId)) {
        if (nodeId._isNode) {
          nodeId = nodeId.id
        } else {
          throw new Error('Invalid argument.')
        }
      }
      doc.update(this.getContentPath(), { type: 'insert', pos: pos, value: nodeId })
    }

    hide(nodeId) {
      const pos = this.getPosition(nodeId)
      this.hideAt(pos)
    }

    hideAt(pos) {
      const length = this.getLength()
      if (pos >= 0 && pos < length) {
        const doc = this.getDocument()
        doc.update(this.getContentPath(), { type: 'delete', pos: pos })
      } else {
        throw new Error('Index out of bounds.')
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
        node = node.getContainerRoot()
      }
      return this.getContent().indexOf(node.id)
    }

    _enableCaching() {
      // this hook is used to invalidate cached positions
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
      if (change.hasUpdated(this.getContentPath())) {
        this._invalidateCache()
      }
    }

    // NOTE: this has been in ParentNodeMixin before
    // TODO: try to get rid of this

    hasChildren() {
      return this.getContent().length > 0
    }

    getChildIndex(child) {
      return this.getContent().indexOf(child.id)
    }

    getChildren() {
      var doc = this.getDocument()
      var childrenIds = this.getContent()
      return childrenIds.map(function(id) {
        return doc.get(id)
      })
    }

    getChildAt(idx) {
      var childrenIds = this.getContent()
      if (idx < 0 || idx >= childrenIds.length) {
        throw new Error('Array index out of bounds: ' + idx + ", " + childrenIds.length)
      }
      return this.getDocument().get(childrenIds[idx])
    }

    getChildCount() {
      return this.getContent().length
    }

  }
  return ContainerMixin
}
