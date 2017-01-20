import XMLExporter from '../../model/XMLExporter'
import TestXMLImporter from './TestXMLImporter'
import DefaultDOMElement from '../../dom/DefaultDOMElement'

class TestXMLExporter extends XMLExporter {

  constructor(config) {
    super(Object.assign({ converters: TestXMLImporter.converters }, config))
  }

  convertDocument(doc) {
    var articleEl = this.createElement('article')
    var body = doc.get('body')
    articleEl.append(
      this.convertContainer(body)
    )
    return articleEl
  }

}

export default TestXMLExporter
