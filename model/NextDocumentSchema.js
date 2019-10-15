import { DefaultDOMElement as DOM } from '../dom'
import DocumentSchema from './DocumentSchema'
import NextDocument from './NextDocument'
import _createValidator from './_createValidator'
import _createDefinition from './_createDefinition'
import _createXmlConverterFactory from './_createXmlConverterFactory'

export default class NextDocumentSchema {
  constructor (version, rootType, nodes, actions) {
    this.name = rootType[0].toUpperCase() + rootType.slice(1)
    this.rootType = rootType
    this.version = version
    this.nodes = nodes
    this.publicId = this._getPublicId(version)
    this.dtd = this._getDtd(version)

    // keep the schema definition here so that we can use it later on for XML validation and im-/export
    this._actions = actions

    // generating validators, importers and exporters lazily
    this._definitions = new Map()
    this._validators = new Map()

    const _definition = this._getDefinition(this.version)

    this._xmlConverterFactory = _createXmlConverterFactory(rootType, _definition)

    // legacy
    this._documentSchema = new DocumentSchema({
      // TODO: we should allow to override NextDocument
      // e.g. to provide a getTitle() implementation, etc.
      DocumentClass: NextDocument,
      nodes: Array.from(nodes.values()),
      definition: _definition
    })
  }

  createDocumentInstance () {
    return new NextDocument(this._documentSchema, this)
  }

  importDocumentFromXml (doc, xmlStr) {
    const xmlDom = DOM.parseXML(xmlStr)
    const xmlSchemaId = xmlDom.getDoctype().publicId
    // identify version
    let version
    for (let v = this.version; v > 0; v--) {
      if (xmlSchemaId === this._getPublicId(v)) {
        version = v
        break
      }
    }
    if (!version) throw new Error(`Unknown xml schema ${xmlSchemaId}`)
    const validator = this._getValidator(version)
    const result = validator.validate(xmlDom)
    if (!result.ok) {
      console.error(result.errors)
      throw new Error('Invalid xml.')
    }
    if (version !== this.version) {
      console.error('TODO: implement migrations')
    }
    const importer = this._xmlConverterFactory.createImporter(doc)
    importer.importIntoDocument(xmlDom)
  }

  exportDocumentToXml (doc) {
    const exporter = this._xmlConverterFactory.createExporter()
    const xmlStr = exporter.convertNode(doc.root).serialize()
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<!DOCTYPE ${this.rootType} PUBLIC "${this.publicId}" "${this.dtd}">`,
      xmlStr
    ].join('\n')
  }

  _getPublicId (version) {
    return `-//SUBSTANCE//DTD ${this.name} v${version}`
  }

  _getDtd (version) {
    return `${this.name}-${version}.dtd`
  }

  _getValidator (version) {
    if (!this._validators.has(version)) {
      this._validators.set(version, _createValidator(this.rootType, this._getDefinition(version)))
    }
    return this._validators.get(version)
  }

  _getDefinition (version) {
    if (!this._definitions.has(version)) {
      this._definitions.set(version, _createDefinition(version, this._actions))
    }
    return this._definitions.get(version)
  }
}
