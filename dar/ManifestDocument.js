import { DefaultDOMElement, prettyPrintXML } from '../dom'
import { Document, DocumentNode, DocumentSchema, documentHelpers, CHILDREN, STRING } from '../model'

export default class ManifestDocument extends Document {
  constructor () {
    super(DARSchema)
  }

  getDocumentNodes () {
    return this.get('dar').resolve('documents')
  }

  getAssetNodes () {
    return this.get('dar').resolve('assets')
  }

  getAssetByFilename (filename) {
    return this.getAssetNodes().find(asset => asset.filename === filename)
  }

  getDocumentEntries () {
    return this.getDocumentNodes().map(_getEntryFromDocumentNode)
  }

  getDocumentEntry (id) {
    const entryNode = this.get(id)
    if (entryNode && entryNode.type === 'document') {
      return _getEntryFromDocumentNode(entryNode)
    }
  }

  static createEmptyManifest () {
    const doc = new ManifestDocument()
    documentHelpers.createNodeFromJson(doc, {
      type: 'dar',
      id: 'dar',
      documents: [],
      assets: []
    })
    return doc
  }

  static fromXML (xmlStr) {
    const xmlDom = DefaultDOMElement.parseXML(xmlStr)

    const manifest = ManifestDocument.createEmptyManifest()
    const documentEls = xmlDom.findAll('documents > document')
    for (const el of documentEls) {
      const documentNode = manifest.create({
        type: 'document',
        id: el.attr('id'),
        documentType: el.attr('type'),
        name: el.attr('name'),
        // TODO: I would prefer 'filename' in the DAR XML
        filename: el.attr('path')
      })
      documentHelpers.append(manifest, ['dar', 'documents'], documentNode.id)
    }
    const assetEls = xmlDom.findAll('assets > asset')
    for (const el of assetEls) {
      const assetNode = manifest.create({
        type: 'asset',
        id: el.attr('id'),
        // TODO: I would prefer 'filename' in the DAR XML
        filename: el.attr('path'),
        // TODO: I would prefer 'mimetype' in the DAR XML
        mimetype: el.attr('type')
      })
      documentHelpers.append(manifest, ['dar', 'assets'], assetNode.id)
    }

    return manifest
  }

  toXml (options = {}) {
    const { assetRefIndex, prettyPrint } = options
    const dar = this.get('dar')
    const xmlDom = DefaultDOMElement.createDocument('xml')
    const $$ = xmlDom.createElement.bind(xmlDom)
    xmlDom.append(
      $$('dar').append(
        $$('documents').append(
          dar.resolve('documents').map(node => {
            const docEl = $$('document').attr({
              id: node.id,
              type: node.documentType,
              path: node.filename
            })
            if (node.name) {
              docEl.setAttribute('name', node.name)
            }
            return docEl
          })
        ),
        $$('assets').append(
          dar.resolve('assets').map(node => {
            const assetEl = $$('asset').attr({
              id: node.id,
              // TODO: I would prefer to use filename instead of 'path' in the DAR XML
              type: node.mimetype,
              path: node.filename
            })
            // EXPERIMENTAL: storing 'unused' to allow for keeping assets around, e.g. when replacing an asset.
            // Similar to the problem in versioning, for undo/redo during a session, all assets need to be retained.
            // Note that this is only used internally, e.g. in RawArchiveFSStorage.
            // TODO: rethink. Maybe we could instead analyse the content of the DAR,
            // But that would either mean to load the documents, or doing a poor man's detection via XML.
            if (assetRefIndex && !assetRefIndex.hasRef(node.id)) {
              assetEl.setAttribute('unused', true)
            }
            return assetEl
          })
        )
      )
    )
    const xmlStr = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE dar PUBLIC "-//SUBSTANCE//DTD DocumentArchive v1.0//EN" "DocumentArchive-1.0.dtd">',
      prettyPrint ? prettyPrintXML(xmlDom) : xmlDom.serialize()
    ].join('\n')
    return xmlStr
  }
}

function _getEntryFromDocumentNode (documentNode) {
  return {
    id: documentNode.id,
    type: documentNode.documentType,
    name: documentNode.name,
    filename: documentNode.filename
  }
}

class DAR extends DocumentNode {}
DAR.schema = {
  type: 'dar',
  documents: CHILDREN('document'),
  assets: CHILDREN('asset')
}

class DARDocument extends DocumentNode {}
DARDocument.schema = {
  type: 'document',
  name: STRING,
  documentType: STRING,
  filename: STRING
}

class DARAsset extends DocumentNode {}
DARAsset.schema = {
  type: 'asset',
  name: STRING,
  filename: STRING,
  mimetype: STRING
}

const DARSchema = new DocumentSchema({
  DocumentClass: ManifestDocument,
  nodes: [DAR, DARDocument, DARAsset]
})
