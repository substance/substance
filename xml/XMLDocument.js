import IncrementalData from '../model/IncrementalData'
import Document from '../model/Document'
import PropertyIndex from '../model/PropertyIndex'
import AnnotationIndex from '../model/AnnotationIndex'
import DocumentNodeFactory from '../model/DocumentNodeFactory'
import uuid from '../util/uuid'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import XMLParentNodeHook from './XMLParentNodeHook'
import XMLEditingInterface from './XMLEditingInterface'

export default
class XMLDocument extends Document {
  _initialize () {
    this.nodeFactory = new DocumentNodeFactory(this)
    this.data = new IncrementalData(this.schema, this.nodeFactory)
    // all by type
    this.addIndex('type', new PropertyIndex('type'))
    // special index for (property-scoped) annotations
    this.addIndex('annotations', new AnnotationIndex())
    XMLParentNodeHook.register(this)
  }

  toXML () {
    let dom = DefaultDOMElement.createDocument('xml')
    dom.setDoctype(...this.getDocTypeParams())
    let xml = dom.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"')
    dom.insertAt(0, xml)
    let rootElement = this.getRootNode().toXML()
    dom.append(rootElement)
    return dom
  }

  getDocTypeParams () {
    // return [qualifiedNameStr, publicId, systemId]
    throw new Error('This method is abstract')
  }

  getXMLSchema () {
    // should provide an XMLSchema instance
    throw new Error('This method is abstract')
  }

  getRootNode () {
    // should provide the root-element
    throw new Error('This method is abstract')
  }

  /*
    Provide a <!DOCTYPE ...> element as a string here
  */
  getDocTypeAsString () {
    return new Error('This method is abstract')
  }

  createEditingInterface () {
    return new XMLEditingInterface(this)
  }

  find (cssSelector) {
    return this.getRootNode().find(cssSelector)
  }

  findAll (cssSelector) {
    return this.getRootNode().findAll(cssSelector)
  }

  createElement (tagName, data) {
    let node = this.create(Object.assign({
      id: uuid(tagName),
      type: tagName
    }, data))
    return node
  }

  getElementSchema (type) {
    return this.getXMLSchema().getElementSchema(type)
  }

  _validateChange (change) {
    let changed = {}
    let deleted = []
    change.ops.forEach((op) => {
      switch (op.type) {
        case 'delete': {
          deleted.push(op.val.id)
          break
        }
        case 'create': {
          changed[op.val.id] = true
          break
        }
        default: {
          if (op.path) {
            changed[op.path[0]] = true
          }
        }
      }
    })
    // do not validate deleted nodes
    deleted.forEach(id => delete changed[id])

    const xmlSchema = this.getXMLSchema()
    let errors = []
    Object.keys(changed).forEach((id) => {
      let node = this.get(id)
      if (node && node._isXMLNode) {
        let res = xmlSchema.validateElement(node)
        if (!res.ok) {
          errors = errors.concat(res.errors)
        }
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
  _apply (documentChange) {
    // TODO is this save?
    if (!documentChange.ops) return

    let created = {}
    let deleted = {}
    let updated = {}
    let affectedContainerAnnos = []

    const doc = this

    function _recordUpdate (id, op) {
      let record = updated[id]
      if (!record) {
        record = updated[id] = { ops: [] }
      }
      if (op) record.ops.push(op)
      return record
    }

    // TODO: we will introduce a special operation type for coordinates
    function _checkAnnotation (op) {
      // HACK: detecting annotation changes in an opportunistic way
      switch (op.type) {
        case 'create':
        case 'delete': {
          const annoData = op.val
          if (annoData.hasOwnProperty('start')) {
            updated[annoData.start.path] = true
            let node = doc.get(annoData.start.path[0])
            if (node) {
              _recordUpdate(node.id, op)
            }
          }
          if (annoData.hasOwnProperty('end')) {
            updated[annoData.end.path] = true
            let node = doc.get(annoData.start.path[0])
            if (node) {
              _recordUpdate(node.id, op)
            }
          }
          break
        }
        case 'update':
        case 'set': {
          let anno = doc.get(op.path[0])
          if (anno) {
            if (anno.isPropertyAnnotation()) {
              updated[anno.start.path] = true
              let node = doc.get(anno.start.path[0])
              if (node) {
                _recordUpdate(node.id, op)
              }
            } else if (anno.isContainerAnnotation()) {
              affectedContainerAnnos.push(anno)
            }
          }
          break
        }
        default:
          //
      }
    }

    documentChange.ops.forEach((op) => {
      // before applying the change we need to track the change
      // Note: this does not work for general ops,
      // only for ops generated via the XMLDocument API
      switch (op.type) {
        case 'create': {
          created[op.path[0]] = op.val
          break
        }
        case 'delete': {
          let node = this.get(op.path[0])
          deleted[node.id] = node
          break
        }
        case 'update':
        case 'set': {
          updated[op.path] = true
          let node = this.get(op.path[0])
          _recordUpdate(node.id, op)
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
}

XMLDocument.prototype._isXMLDocument = true
