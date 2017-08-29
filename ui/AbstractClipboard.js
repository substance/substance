import { platform, substanceGlobals } from '../util'
import ClipboardImporter from './ClipboardImporter'
import ClipboardExporter from './ClipboardExporter'

export default class AbstractClipboard {

  constructor(configurator) {
    let schema = configurator.getSchema()
    let converterRegistry = configurator.converterRegistry
    let htmlConverters = []
    if (converterRegistry && converterRegistry.contains('html')) {
      htmlConverters = converterRegistry.get('html').values() || []
    }
    // Note: this config object is used for creating
    // ClipboardImporter and ClipboardExporter
    this._config = {
      schema: schema,
      DocumentClass: schema.getDocumentClass(),
      converters: htmlConverters,
      editorOptions: configurator.getEditorOptions()
    }
  }

  /*
    Called when copy event fired.

    @param {Event} event
  */
  onCopy(event) {
    // console.log("Clipboard.onCopy", arguments);
    let clipboardData = this._copy()
    substanceGlobals._clipboardData = event.clipboardData

    if (event.clipboardData && clipboardData.doc) {
      event.preventDefault()
      // store as plain text and html
      event.clipboardData.setData('text/plain', clipboardData.text)
      // WORKAROUND: under IE and Edge it is not permitted to set 'text/html'
      if (!platform.isIE && !platform.isEdge) {
        event.clipboardData.setData('text/html', clipboardData.html)
      }
    }
  }

  /*
    Called when cut event fired.

    @param {Event} event
  */
  onCut(event) {
    // preventing default behavior to avoid that contenteditable destroys our DOM
    event.preventDefault()
    // console.log("Clipboard.onCut", arguments);
    this.onCopy(event)
    this._cut()
  }

  /*
    Called when paste event fired.

    @param {Event} event
  */
  // Works on Safari/Chrome/FF
  onPaste(event) {
    let clipboardData = event.clipboardData

    let types = {}
    for (let i = 0; i < clipboardData.types.length; i++) {
      types[clipboardData.types[i]] = true
    }
    // console.log('onPaste(): received content types', types);

    event.preventDefault()
    event.stopPropagation()

    let plainText
    let html
    if (types['text/plain']) {
      plainText = clipboardData.getData('text/plain')
    }
    if (types['text/html']) {
      html = clipboardData.getData('text/html')
    }

    // HACK: to allow at least in app copy and paste under Edge (which blocks HTML)
    // we guess by comparing the old and new plain text
    if (platform.isEdge &&
        substanceGlobals.clipboardData &&
        substanceGlobals.clipboardData.text === plainText) {
      html = substanceGlobals.clipboardData.html
    } else {
      substanceGlobals.clipboardData = {
        text: plainText,
        html: html
      }
    }

    // console.log('onPaste(): html = ', html);

    // WORKAROUND: FF does not provide HTML coming in from other applications
    // so fall back to pasting plain text
    if (platform.isFF && !html) {
      this._pastePlainText(plainText)
      return
    }

    // if we have content given as HTML we let the importer assess the quality first
    // and fallback to plain text import if it's bad
    if (html) {
      if (!this._pasteHtml(html, plainText)) {
        this._pastePlainText(plainText)
      }
    } else {
      this._pastePlainText(plainText)
    }
  }

  _getImporter() {
    return new new ClipboardImporter(this._config)
  }

  _getExporter() {
    return new ClipboardExporter(this._config)
  }

  /*
    Copies selected content from document returning a new document instance.
  */
  _copy() {
    throw new Error('This method is abstract.')
  }

  /*
    Removes the selected content from the document.
  */
  _cut() {
    throw new Error('This method is abstract.')
  }

  /*
    Pastes a given plain text into the editor.

    @param {String} plainText plain text
  */
  _pastePlainText(plainText) { // eslint-disable-line
    throw new Error('This method is abstract.')
  }

  /*
    Pastes a given parsed html document into the surface.

    @param {ui/DOMElement} docElement
    @param {String} text plain text representation used as a fallback
  */
  _pasteHtml(html, text) { // eslint-disable-line
    throw new Error('This method is abstract.')
  }

}