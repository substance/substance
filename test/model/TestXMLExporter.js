import XMLExporter from '../../model/XMLExporter'
import converters from './TestXMLImporter'.converters
import DefaultDOMElement from '../../ui/DefaultDOMElement'

class TestXMLExporter extends XMLExporter {

  constructor() {
    super({ converters: converters })
  }

  convertDocument(doc) {
    var articleEl = DefaultDOMElement.parseXML('<article></article>')
    var body = doc.get('body')
    articleEl.append(
      this.convertContainer(body)
    )
    return articleEl
  }

}

export default TestXMLExporter
