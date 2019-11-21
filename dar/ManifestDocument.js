import { DefaultDOMElement } from '../dom'
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

  getAssetByPath (path) {
    return this.getAssetNodes().find(asset => asset.path === path)
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
        path: el.attr('path')
      })
      documentHelpers.append(manifest, ['dar', 'documents'], documentNode.id)
    }
    const assetEls = xmlDom.findAll('assets > asset')
    for (const el of assetEls) {
      const assetNode = manifest.create({
        type: 'asset',
        id: el.attr('id'),
        assetType: el.attr('type'),
        path: el.attr('path'),
        sync: el.attr('sync') === 'true'
      })
      documentHelpers.append(manifest, ['dar', 'assets'], assetNode.id)
    }

    return manifest
  }

  toXML () {
    const dar = this.get('dar')
    const xmlDom = DefaultDOMElement.createDocument('xml')
    const $$ = xmlDom.createElement.bind(xmlDom)
    xmlDom.append(
      $$('dar').append(
        $$('documents').append(
          dar.resolve('documents').map(node => {
            return $$('document').attr({
              id: node.id,
              type: node.documentType,
              name: node.name,
              path: node.path
            })
          })
        ),
        $$('assets').append(
          dar.resolve('assets').map(node => {
            return $$('asset').attr({
              id: node.id,
              type: node.assetType,
              path: node.path,
              sync: node.sync ? 'true' : undefined
            })
          })
        )
      )
    )
    return xmlDom
  }
}

function _getEntryFromDocumentNode (documentNode) {
  return {
    id: documentNode.id,
    path: documentNode.path,
    type: documentNode.documentType,
    name: documentNode.name
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
  path: STRING
}

class DARAsset extends DocumentNode {}
DARAsset.schema = {
  type: 'asset',
  name: STRING,
  assetType: STRING,
  path: STRING
}

const DARSchema = new DocumentSchema({
  DocumentClass: ManifestDocument,
  nodes: [DAR, DARDocument, DARAsset]
})
