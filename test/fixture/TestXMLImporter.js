import { XMLImporter } from 'substance'

class TestXMLImporter extends XMLImporter {
  convertDocument (documentEl) {
    this.state.doc = this.createDocument()
    var bodyEl = documentEl.find('body')
    this.convertContainer(bodyEl.children, 'body')
  }
}

export default TestXMLImporter
