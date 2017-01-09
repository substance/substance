import DOMImporter from './DOMImporter'
import DefaultDOMElement from '../dom/DefaultDOMElement'

/*
  Base class for custom HTML importers. If you want to use XML as your
  exchange format see {@link model/XMLImporter}.

  @class
  @abstract
*/
class HTMLImporter extends DOMImporter {

  constructor(config) {
    super(Object.assign({ idAttribute: 'data-id' }, config))

    // only used internally for creating wrapper elements
    this._el = DefaultDOMElement.parseHTML('<html></html>')
  }

  importDocument(html) {
    this.reset()
    var parsed = DefaultDOMElement.parseHTML(html)
    // creating all nodes
    this.convertDocument(parsed)
    this.generateDocument()
    return this.state.doc
  }

  /**
    Orchestrates conversion of a whole document.

    This method should be overridden by custom importers to reflect the
    structure of a custom HTML document or fragment, and to control where
    things go to within the document.

    @abstract
    @param {ui/DOMElement} documentEl the document element.

    @example

    When a fragment `<h1>Foo</h1><p></Bar</p>` is imported the implementation
    looks like this.

    ```js
      convertDocument(els) {
        this.convertContainer(els, 'body')
      }
    ```

    If a full document `<html><body><p>A</p><p>B</p></body></html>` is imported
    you get the `<html>` element instead of a node array.

    ```js
      convertDocument(htmlEl) {
        var bodyEl = htmlEl.find('body')
        this.convertContainer(bodyEl.children, 'body')
      }
    ```
  */
  convertDocument(documentEl) { // eslint-disable-line
    throw new Error('This method is abstract')
  }

}

export default HTMLImporter
