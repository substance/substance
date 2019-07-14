import { HTMLExporter } from 'substance'

export default class TestHTMLExporter extends HTMLExporter {
  convertDocument (doc) {
    let el = this.createElement('div')
    el.append(
      this.convertContainer(doc, ['body', 'nodes'])
    )
    return el
  }
}
