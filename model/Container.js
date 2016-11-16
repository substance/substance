import extend from 'lodash/extend'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import DocumentNode from './DocumentNode'
import ParentNodeMixin from './ParentNodeMixin'
import ContainerAddress from './ContainerAddress'

/*
  A Container represents a list of nodes.

  While most editing occurs on a property level (such as editing text),
  other things happen on a node level, e.g., breaking or mergin nodes,
  or spanning annotations or so called ContainerAnnotations.

  @class
  @prop {String[]} nodes
*/
class Container extends DocumentNode {

  constructor(...args) {
    super(...args)
    // HACK: we invalidate cached positions on every change
    // NOTE, that in trans action docs we don't do caching
    if (this.document && !this.document.isTransactionDocument) {
      this.document.on('document:changed', this._onChange, this)
    }
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

  getPosition(nodeId) {
    // HACK: ATM we are caching only in the real Document
    // i.e., which is connected to the UI etc.
    if (this.document && this.document.isTransactionDocument) {
      return this.getContent().indexOf(nodeId)
    } else {
      var positions = this._getCachedPositions()
      var pos = positions[nodeId]
      if (pos === undefined) {
        pos = -1
      }
      return pos
    }
  }

  getNodeAt(idx) {
    let content = this.getContent()
    if (idx < 0 || idx >= content.length) {
      throw new Error('Array index out of bounds: ' + idx + ", " + content.length)
    }
    return this.getDocument().get(content[idx])
  }

  getNodes() {
    let doc = this.getDocument()
    return this.getContent().map(function(id) {
      return doc.get(id)
    }).filter(Boolean)
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

  _onChange(change) {
    if (change.isUpdated(this.getContentPath())) {
      this.positions = null
    }
  }

  _getCachedPositions() {
    if (!this.positions) {
      var positions = {}
      this.nodes.forEach(function(id, pos) {
        positions[id] = pos
      })
      this.positions = positions
    }
    return this.positions
  }

}

Container.prototype._isContainer = true

// HACK: using a mixin here
// TODO: Get rid of this ParentNodeMixin
extend(Container.prototype, ParentNodeMixin)

Container.prototype.getChildrenProperty = function() {
  return 'nodes'
}

Container.define({
  type: "container",
  nodes: { type: ['id'], default: [] }
})

export default Container
