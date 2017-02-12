import XMLExporter from '../../model/XMLExporter'

class TestXMLExporter extends XMLExporter {

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
