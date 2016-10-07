import HTMLExporter from '../../model/HTMLExporter'
import TestHTMLImporter from './TestHTMLImporter'
const converters = TestHTMLImporter.converters

class TestHTMLExporter extends HTMLExporter {

  constructor() {
    super({
      converters: converters
    })
  }

  convertDocument(doc, htmlEl) {
    var bodyEl = htmlEl.find('body')
    var body = doc.get('body')
    bodyEl.append(
      this.convertContainer(body)
    )
    return htmlEl
  }

}

export default TestHTMLExporter
