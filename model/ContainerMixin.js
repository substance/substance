import isNumber from '../util/isNumber'
import isString from '../util/isString'
import { getContainerPosition } from './documentHelpers'

export default function (DocumentNode) {
  class AbstractContainer extends DocumentNode {
    getContentPath () {
      throw new Error('This method is abstract')
    }

    getContent () {
      let doc = this.getDocument()
      return doc.get(this.getContentPath())
    }

    contains (nodeId) {
      return this.getChildIndex(nodeId) >= 0
    }

    getNodeAt (idx) {
      const nodeId = this._getNodeIdAt(idx)
      if (nodeId) {
        return this.getDocument().get(nodeId)
      }
    }

    getNodes () {
      const doc = this.getDocument()
      return this.getContent().map(id => doc.get(id)).filter(Boolean)
    }

    getNodeIndex (id) {
      return this.getContent().indexOf(id)
    }

    getPath () {
      return this.getContentPath()
    }

    append (nodeId) {
      // allow to provide a node instance instead of nodeId
      const arg1 = arguments[0]
      if (!isString(arg1)) {
        if (arg1._isNode) {
          nodeId = arg1.id
        }
      }
      return this.insertAt(this.length, nodeId)
    }

    insertAt (pos, nodeId) {
      const doc = this.getDocument()
      const length = this.length
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

    remove (nodeId) {
      const pos = getContainerPosition(this.getDocument(), this.getContentPath(), nodeId)
      this.removeAt(pos)
    }

    removeAt (pos) {
      const length = this.length
      if (pos >= 0 && pos < length) {
        const doc = this.getDocument()
        doc.update(this.getContentPath(), { type: 'delete', pos: pos })
      } else {
        throw new Error('Index out of bounds.')
      }
    }

    get length () {
      return this.getLength()
    }

    getLength () {
      return this.getContent().length
    }

    _getNodeIdAt (idx) {
      let content = this.getContent()
      if (idx < 0 || idx >= content.length) {
        // throw new Error('Array index out of bounds: ' + idx + ", " + content.length)
        return undefined
      } else {
        return content[idx]
      }
    }

    static isContainer () {
      return true
    }
  }
  return AbstractContainer
}
