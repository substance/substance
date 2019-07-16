import { XMLImporter } from 'substance'

export default class TestXMLImporter extends XMLImporter {
  convertDocument (documentEl) {
    this.state.doc = this.createDocument()
    var bodyEl = documentEl.find('body')
    this.convertContainer(bodyEl.children, 'body')
  }
}
