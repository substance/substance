import {
  IncrementalData, Document,
  PropertyIndex, AnnotationIndex,
  DocumentNodeFactory
} from '../model'
import { uuid } from '../util'
import { DefaultDOMElement } from '../dom'

import ParentNodeHook from './ParentNodeHook'
import XMLEditingInterface from './XMLEditingInterface'

export default
class XMLDocument extends Document {

  _initialize() {
    this.nodeFactory = new DocumentNodeFactory(this)
    this.data = new IncrementalData(this.schema, this.nodeFactory)
    // all by type
    this.addIndex('type', new PropertyIndex('type'))
    // special index for (property-scoped) annotations
    this.addIndex('annotations', new AnnotationIndex())
    ParentNodeHook.register(this)
  }

  toXML() {
    let dom = DefaultDOMElement.createDocument('xml')
    dom.setDocType(...this.getDocTypeParams())
    let rootElement = this.getRootNode().toXML()
    dom.append(rootElement)
    return dom
  }

  getDocTypeParams() {
    // return [qualifiedNameStr, publicId, systemId]
    throw new Error('This method is abstract')
  }

  getXMLSchema() {
    // should provide an XMLSchema instance
    throw new Error('This method is abstract')
  }

  getRootNode() {
    // should provide the root-element
    throw new Error('This method is abstract')
  }

  /*
    Provide a <!DOCTYPE ...> element as a string here
  */
  getDocTypeAsString() {
    return new Error('This method is abstract')
  }

  createEditingInterface() {
    return new XMLEditingInterface(this)
  }

  find(cssSelector) {
    return this.getRootNode().find(cssSelector)
  }

  findAll(cssSelector) {
    return this.getRootNode().findAll(cssSelector)
  }

  createElement(tagName) {
    let node = this.create({
      id: uuid(tagName),
      type: tagName
    })
    return node
  }

  getElementSchema(type) {
    return this.getXMLSchema().getElementSchema(type)
  }

  _validateChange(change) {
    let changed = {}
    let deleted = []
    change.ops.forEach((op) => {
      switch (op.type) {
        case "delete": {
          deleted.push(op.val.id)
          break
        }
        case "create": {
          changed[op.val.id] = true
          break
        }
        default: {
          changed[op.path[0]] = true
        }
      }
    })
    // do not validate deleted nodes
    deleted.forEach(id => delete changed[id])

    const xmlSchema = this.getXMLSchema()
    let errors = []
    Object.keys(changed).forEach((id) => {
      let node = this.get(id)
      let res = xmlSchema.validateElement(node)
      if (!res.ok) {
        errors = errors.concat(res.errors)
      }
    })
    return {
      ok: errors.length === 0,
      errors
    }
  }

  /*
    Experimental: analyzing the change on-the-fly
    so that we can track changes hierarchically
  */
  _apply(documentChange) {
    // TODO is this save?
    if (!documentChange.ops) return

    let created = {}
    let deleted = {}
    let updated = {}
    let affectedContainerAnnos = []

    const doc = this

    function _recordUpdate(id, level, op) {
      let record = updated[id]
      if (!record) {
        record = updated[id] = { ops: [], level }
      } else {
        record.level = Math.min(level, record.level)
      }
      if (op) record.ops.push(op)
      return record
    }

    function _recordAncestorUpdates(node) {
      doc._forEachAncestor(node, (ancestor, level) => {
        _recordUpdate(ancestor.id, level)
      })
    }

    // TODO: we will introduce a special operation type for coordinates
    function _checkAnnotation(op) {
      // HACK: detecting annotation changes in an opportunistic way
      switch (op.type) {
        case "create":
        case "delete": {
          const annoData = op.val
          if (annoData.hasOwnProperty('start')) {
            updated[annoData.start.path] = true
            let node = doc.get(annoData.start.path[0])
            if (node) {
              _recordUpdate(node.id, 0, op)
              _recordAncestorUpdates(node)
            }
          }
          if (annoData.hasOwnProperty('end')) {
            updated[annoData.end.path] = true
            let node = doc.get(annoData.start.path[0])
            if (node) {
              _recordUpdate(node.id, 0, op)
              _recordAncestorUpdates(node)
            }
          }
          break
        }
        case "update":
        case "set": {
          let anno = doc.get(op.path[0])
          if (anno) {
            if (anno.isPropertyAnnotation()) {
              updated[anno.start.path] = true
              let node = doc.get(anno.start.path[0])
              if (node) {
                _recordUpdate(node.id, 0, op)
                _recordAncestorUpdates(node)
              }
            } else if (anno.isContainerAnnotation()) {
              affectedContainerAnnos.push(anno)
            }
          }
          break
        }
        default:
          /* istanbul ignore next */
          throw new Error('Illegal state')
      }
    }

    documentChange.ops.forEach((op) => {
      // before applying the change we need to track the change
      // Note: this does not work for general ops,
      // only for ops generated via the XMLDocument API
      switch(op.type) {
        case 'create': {
          created[op.path[0]] = op.val
          break
        }
        case 'delete': {
          let node = this.get(op.path[0])
          _recordAncestorUpdates(node)
          deleted[node.id] = node
          break
        }
        case 'update':
        case 'set': {
          updated[op.path] = true
          let node = this.get(op.path[0])
          _recordUpdate(node.id, 0, op)
          _recordAncestorUpdates(node)
          break
        }
        default:
          //
      }
      // record impacts of changes to annotations
      _checkAnnotation(op)

      this._applyOp(op)
    })
    // clear updates for deleted nodes
    Object.keys(deleted).forEach((id) => {
      delete updated[id]
    })
    documentChange.created = created
    documentChange.updated = updated
    documentChange.deleted = deleted
    documentChange._extracted = true
  }

  _forEachAncestor(node, fn) {
    let level = 0
    while ((node = node.parentNode)) {
      level++
      fn(node, level)
    }
  }

}

XMLDocument.prototype._isXMLDocument = true
