import { HTMLImporter } from 'substance'

export default class TestHTMLImporter extends HTMLImporter {
  convertDocument (documentEl) {
    this.state.doc = this.createDocument()
    var bodyEl = documentEl.find('body')
    this.convertContainer(bodyEl.children, 'body')
  }

  _getUnsupportedElementConverter () {
    return _UnsupportedElementImporter
  }
}

const _UnsupportedElementImporter = {
  type: 'paragraph',
  import (el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content'], { preserveWhitespace: true })
  }
}
