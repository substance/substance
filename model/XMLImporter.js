import DOMImporter from './DOMImporter'
import DefaultDOMElement from '../dom/DefaultDOMElement'

/*
  Base class for custom XML importers. If you want to use HTML as your
  exchange format see {@link model/HTMLImporter}.

  TODO: provide example and activate reenable API docs
*/

class XMLImporter extends DOMImporter {

  constructor(config, context) {
    super(Object.assign({ idAttribute: 'id' }, config), context)
    // only used internally for creating wrapper elements
    this._el = DefaultDOMElement.parseXML('<dummy></dummy>')
  }

  importDocument(xml) {
    // initialization
    this.reset()
    // converting to JSON first
    var articleElement = DefaultDOMElement.parseXML(xml)
    this.convertDocument(articleElement)
    var doc = this.generateDocument()
    return doc
  }

}

export default XMLImporter
