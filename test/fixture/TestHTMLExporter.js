import HTMLExporter from '../../model/HTMLExporter'
import TestHTMLImporter from './TestHTMLImporter'
const converters = TestHTMLImporter.converters

class TestHTMLExporter extends HTMLExporter {

  constructor(config) {
    super(Object.assign({
      converters: converters
    }, config))
  }

  convertDocument(doc) {
    let el = this.createElement('div')
    el.append(
      this.convertContainer(doc.get('body'))
    )
    return el
  }

}

export default TestHTMLExporter
