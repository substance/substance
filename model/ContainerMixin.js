import isNumber from '../util/isNumber'
import isString from '../util/isString'
import { getNodes, getContainerPosition } from './documentHelpers'

export default function (DocumentNode) {
  class AbstractContainer extends DocumentNode {
    contains (nodeId) {
      return this.getPosition(nodeId) >= 0
    }

    getNodeAt (idx) {
      const nodeId = this.getNodeIdAt(idx)
      if (nodeId) {
        return this.getDocument().get(nodeId)
      }
    }

    getNodeIdAt (idx) {
      let content = this.getContent()
      if (idx < 0 || idx >= content.length) {
        // throw new Error('Array index out of bounds: ' + idx + ", " + content.length)
        return undefined
      } else {
        return content[idx]
      }
    }

    getNodes () {
      const doc = this.getDocument()
      return this.getContent().map(id => doc.get(id)).filter(Boolean)
    }

    show (nodeId, pos) {
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

    showAt (pos, nodeId) {
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

    hide (nodeId) {
      const pos = getContainerPosition(this.getDocument(), this.getContentPath(), nodeId)
      this.hideAt(pos)
    }

    hideAt (pos) {
      const length = this.getLength()
      if (pos >= 0 && pos < length) {
        const doc = this.getDocument()
        doc.update(this.getContentPath(), { type: 'delete', pos: pos })
      } else {
        throw new Error('Index out of bounds.')
      }
    }

    getLength () {
      return this.getContent().length
    }

    get length () {
      return this.getLength()
    }

    hasChildren () {
      return this.getContent().length > 0
    }

    getChildIndex (child) {
      return this.getContent().indexOf(child.id)
    }

    getChildren () {
      return getNodes(this.getDocument(), this.getContent())
    }

    getChildAt (idx) {
      var childrenIds = this.getContent()
      if (idx < 0 || idx >= childrenIds.length) {
        throw new Error('Array index out of bounds: ' + idx + ', ' + childrenIds.length)
      }
      return this.getDocument().get(childrenIds[idx], 'strict')
    }

    getChildCount () {
      return this.getContent().length
    }

    static isContainer () {
      return true
    }
  }
  return AbstractContainer
}
