import { HTMLExporter } from 'substance'

class TestHTMLExporter extends HTMLExporter {

  convertDocument(doc) {
    let el = this.createElement('div')
    el.append(
      this.convertContainer(doc.get('body'))
    )
    return el
  }

}

export default TestHTMLExporter
