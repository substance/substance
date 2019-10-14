import HTMLImporter from '../model/HTMLImporter'

export default class DefaultHtmlImporter extends HTMLImporter {
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
