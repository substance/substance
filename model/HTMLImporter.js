import DefaultDOMElement from '../dom/DefaultDOMElement'
import DOMImporter from './DOMImporter'

/**
 * Base class for custom HTML importers. If you want to use XML as your
 * exchange format see {@link model/XMLImporter}.
 *
 * @abstract
 */
export default class HTMLImporter extends DOMImporter {
  constructor (params, doc, options) {
    super(_defaultParams(params, options), doc, options)

    // disabling warnings about default importers
    this.IGNORE_DEFAULT_WARNINGS = true
    // only used internally for creating wrapper elements
    this._el = DefaultDOMElement.parseHTML('<html></html>')
  }

  importDocument (html) {
    this.reset()
    const parsed = DefaultDOMElement.parseHTML(html)
    this.convertDocument(parsed)
    return this.state.doc
  }

  /**
   * Orchestrates conversion of a whole document.
   *
   * This method should be overridden by custom importers to reflect the
   * structure of a custom HTML document or fragment, and to control where
   * things go to within the document.
   *
   * @abstract
   * @param {DOMElement} documentEl the document element.
   *
   * @example
   *
   *  When a fragment `<h1>Foo</h1><p></Bar</p>` is imported the implementation
   *  looks like this.
   *
   * ```js
   *   convertDocument(els) {
   *     this.convertContainer(els, 'body')
   *   }
   * ```
   *
   * If a full document `<html><body><p>A</p><p>B</p></body></html>` is imported
   * you get the `<html>` element instead of a node array.
   *
   * ```js
   *   convertDocument(htmlEl) {
   *     var bodyEl = htmlEl.find('body')
   *     this.convertContainer(bodyEl.children, 'body')
   *   }
   * ```
   */
  convertDocument(documentEl) { // eslint-disable-line
    throw new Error('This method is abstract')
  }
}

function _defaultParams (params, options) {
  return Object.assign({ idAttribute: 'data-id' }, params, options)
}
