import Document from '../model/Document'
import HtmlExporter from '../model/HTMLExporter'
import JSONConverter from '../model/JSONConverter'

/**
  Export HTML from clipboard. Used for inter-application copy'n'paste.

  @internal
*/
class ClipboardExporter extends HtmlExporter {

  /**
    Exports document in html format.

    @param {Document} doc document to export

    @return {String} html representation of given document
  */
  exportDocument(doc) {
    this.state.doc = doc
    let html
    let elements = this.convertDocument(doc);
    // special treatment for a text snippet
    if (elements.length === 1 && elements[0].attr('data-id') === Document.TEXT_SNIPPET_ID) {
      html = elements[0].innerHTML
    } else {
      html = elements.map(function(el) {
        return el.outerHTML
      }).join('')
    }
    let jsonConverter = new JSONConverter()
    let jsonStr = JSON.stringify(jsonConverter.exportDocument(doc))
    let meta = [
      "<meta name='substance' content='",
      btoa(jsonStr),
      "'>"
    ].join('')
    return '<html><head>' +meta+ '</head><body>' + html + '</body></html>'
  }

  /**
    Coverts document to set of DOM elements.

    @param {Document} doc document to convert

    @return {Array} array of DOM elements each represented single node
  */
  convertDocument(doc) {
    let content = doc.get(Document.SNIPPET_ID)
    if (!content) {
      throw new Error('Illegal clipboard document: could not find container "' + Document.SNIPPET_ID + '"')
    }
    return this.convertContainer(content)
  }

}

export default ClipboardExporter
