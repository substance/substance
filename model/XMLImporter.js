import { DefaultDOMElement } from '../dom'
import DOMImporter from './DOMImporter'

/*
  Base class for custom XML importers. If you want to use HTML as your
  exchange format see {@link model/HTMLImporter}.

  TODO: provide example and activate reenable API docs
*/

class XMLImporter extends DOMImporter {

  constructor(config, context) {
    super(Object.assign({ idAttribute: 'id' }, config), context)
  }

  importDocument(xml) {
    this.reset()
    let dom = DefaultDOMElement.parseXML(xml)
    this.convertDocument(dom)
    return this.state.doc
  }

}

export default XMLImporter
