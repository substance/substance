import platform from '../util/platform'
import substanceGlobals from '../util/substanceGlobals'
import copySelection from '../model/copySelection'
import documentHelpers from '../model/documentHelpers'
import ClipboardImporter from '../ui/ClipboardImporter'
import ClipboardExporter from '../ui/ClipboardExporter'

/**
  The Clipboard is a Component which should be rendered as a sibling component
  of one or multiple Surfaces.

  It uses the JSONImporter and JSONExporter for internal copy'n'pasting,
  i.e., within one window or between two instances with the same DocumentSchema.

  For inter-application copy'n'paste, the ClipboardImporter and ClipboardExporter is used.

  @internal
*/
class Clipboard {

  constructor(editorSession, config) {
    this.editorSession = editorSession
    let doc = editorSession.getDocument()
    let schema = doc.getSchema()

    let htmlConverters = []
    if (config.converterRegistry) {
      htmlConverters = config.converterRegistry.get('html') || []
    }
    let _config = {
      schema: schema,
      DocumentClass: doc.constructor,
      converters: htmlConverters
    }

    this.htmlImporter = new ClipboardImporter(_config)
    this.htmlExporter = new ClipboardExporter(_config)
  }

  getEditorSession() {
    return this.editorSession
  }

  /*
    Called by to enable clipboard handling on a given root element.
  */
  attach(el) {
    el.on('copy', this.onCopy, this)
    el.on('cut', this.onCut, this)
    el.on('paste', this.onPaste, this)
  }

  /*
    Called by to disable clipboard handling.
  */
  detach(el) {
    el.off(this)
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
    // preventing default behavior to avoid that contenteditable
    // destroys our DOM
    event.preventDefault()
    // console.log("Clipboard.onCut", arguments);
    this.onCopy(event)
    let editorSession = this.getEditorSession()
    editorSession.transaction((tx)=>{
      tx.deleteSelection()
    })
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

  /*
    Pastes a given plain text into the surface.

    @param {String} plainText plain text
  */
  _pastePlainText(plainText) {
    let editorSession = this.getEditorSession()
    editorSession.transaction(function(tx) {
      tx.paste(plainText)
    }, { action: 'paste' })
  }

  /*
    Copies selected content from document to clipboard.
  */
  _copy() {
    let editorSession = this.getEditorSession()
    let sel = editorSession.getSelection()
    let doc = editorSession.getDocument()
    let clipboardDoc = null
    let clipboardText = ""
    let clipboardHtml = ""
    if (!sel.isCollapsed()) {
      clipboardText = documentHelpers.getTextForSelection(doc, sel) || ""
      clipboardDoc = copySelection(doc, sel)
      clipboardHtml = this.htmlExporter.exportDocument(clipboardDoc)
    }
    return {
      doc: clipboardDoc,
      html: clipboardHtml,
      text: clipboardText
    }
  }

  /*
    Pastes a given parsed html document into the surface.

    @param {ui/DOMElement} docElement
    @param {String} text plain text representation used as a fallback
  */
  _pasteHtml(html, text) {
    let content = this.htmlImporter.importDocument(html)
    this.paste(content, text)
    return true
  }

  /*
    Takes a clipboard document and pastes it at the current
    cursor position.

    Used by PasteCommand
  */
  paste(doc, text) {
    let content = doc || text
    let editorSession = this.getEditorSession()
    if (content) {
      editorSession.transaction((tx) => {
        tx.paste(content)
      }, { action: 'paste' })
    }
  }

}

export default Clipboard
