import { DefaultDOMElement as DOM, prettyPrintXML } from '../dom'
import { camelCase } from '../util'
import DocumentSchema from './DocumentSchema'
import NextDocument from './NextDocument'
import _createValidator from './_createValidator'
import _createDefinition from './_createDefinition'
import _createXmlConverterFactory from './_createXmlConverterFactory'

export default class NextDocumentSchema {
  constructor (version, rootType, issuer, nodes, actions) {
    this.name = rootType[0].toUpperCase() + camelCase(rootType).slice(1)
    this.rootType = rootType
    this.version = version
    this.issuer = issuer
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

  importDocumentFromXml (doc, xmlStr, context) {
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
    const importer = this._createXmlImporter(doc, context)
    importer.importIntoDocument(xmlDom)
  }

  exportDocumentToXml (doc, context = {}, options = {}) {
    const exporter = this._xmlConverterFactory.createExporter(context)
    const dom = exporter.convertNode(doc.root)
    let xmlStr
    if (options.prettyPrint) {
      xmlStr = prettyPrintXML(dom)
    } else {
      xmlStr = dom.serialize()
    }
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<!DOCTYPE ${this.rootType} PUBLIC "${this.publicId}" "${this.dtd}">`,
      xmlStr
    ].join('\n')
  }

  getNodeSchema (type) {
    return this._documentSchema.getNodeSchema(type)
  }

  getNodeClass (type) {
    return this._documentSchema.getNodeClass(type)
  }

  getDefaultTextType () {
    console.error('DEPRECATED: avoid using schema.getDefaultTextType(). Instead a "container" type should provide this in its schema.')
    return null
  }

  _getPublicId (version) {
    // TODO: until we introduce minor versions we just use '0' for minor
    return `-//${this.issuer.toUpperCase()}//DTD ${this.name} v${version}.0//EN`
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

  _createXmlImporter (doc, context) {
    return this._xmlConverterFactory.createImporter(doc, context)
  }
}
