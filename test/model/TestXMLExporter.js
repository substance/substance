import XMLExporter from '../../model/XMLExporter'
import TestXMLImporter from './TestXMLImporter'
import DefaultDOMElement from '../../ui/DefaultDOMElement'

class TestXMLExporter extends XMLExporter {

  constructor() {
    super({ converters: TestXMLImporter.converters })
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
