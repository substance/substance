import DefaultDOMElement from '../dom/DefaultDOMElement'
import DOMImporter from './DOMImporter'

export default class XMLImporter extends DOMImporter {
  constructor (params, doc, options = {}) {
    super(_defaultParams(params, options), doc, options)
  }

  importDocument (xml) {
    this.reset()
    const dom = DefaultDOMElement.parseXML(xml)
    this.convertDocument(dom)
    return this.state.doc
  }

  convertDocument (xmlDocument) {
    const rootNode = xmlDocument.children[0]
    if (!rootNode) throw new Error('XML Root node could not be found.')
    this.convertElement(rootNode)
  }
}

function _defaultParams (params, options) {
  return Object.assign({ idAttribute: 'id' }, params, options)
}
