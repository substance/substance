import { XMLExporter } from 'substance'

class TestXMLExporter extends XMLExporter {
  convertDocument (doc) {
    var articleEl = this.createElement('article')
    var body = doc.get('body')
    articleEl.append(
      this.convertContainer(doc, body.getContentPath())
    )
    return articleEl
  }
}

export default TestXMLExporter
