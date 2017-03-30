import { HTMLImporter } from 'substance'

class TestHTMLImporter extends HTMLImporter {

  convertDocument(documentEl) {
    this.state.doc = this.createDocument()
    var bodyEl = documentEl.find('body')
    this.convertContainer(bodyEl.children, 'body')
  }

}

export default TestHTMLImporter
