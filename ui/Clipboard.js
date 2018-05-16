import copySelection from '../model/copySelection'
import { getTextForSelection } from '../model/documentHelpers'
import AbstractClipboard from './AbstractClipboard'

/**
  The Clipboard is a Component which should be rendered as a sibling component
  of one or multiple Surfaces.

  It uses the JSONImporter and JSONExporter for internal copy'n'pasting,
  i.e., within one window or between two instances with the same DocumentSchema.

  For inter-application copy'n'paste, the ClipboardImporter and ClipboardExporter is used.

  @internal
*/
export default class Clipboard extends AbstractClipboard {
  constructor (editorSession) {
    super(editorSession.getConfigurator())

    this.editorSession = editorSession
  }

  /*
    Copies selected content from document to clipboard.
  */
  _copy () {
    let editorSession = this.getEditorSession()
    let sel = editorSession.getSelection()
    let doc = editorSession.getDocument()
    let clipboardDoc = null
    let clipboardText = ''
    let clipboardHtml = ''
    let htmlExporter = this._getExporter()
    if (!sel.isCollapsed()) {
      clipboardText = getTextForSelection(doc, sel) || ''
      clipboardDoc = copySelection(doc, sel)
      clipboardHtml = htmlExporter.exportDocument(clipboardDoc)
    }
    return {
      doc: clipboardDoc,
      html: clipboardHtml,
      text: clipboardText
    }
  }

  _cut () {
    let editorSession = this.getEditorSession()
    editorSession.transaction((tx) => {
      tx.deleteSelection()
    })
  }

  /*
    Pastes a given plain text into the surface.

    @param {String} plainText plain text
  */
  _pastePlainText (plainText) {
    let editorSession = this.getEditorSession()
    editorSession.transaction(function (tx) {
      tx.paste(plainText)
    }, { action: 'paste' })
  }

  /*
    Pastes a given parsed html document into the surface.

    @param {ui/DOMElement} docElement
    @param {String} text plain text representation used as a fallback
  */
  _pasteHtml (html, text) {
    let htmlImporter = this._getImporter()
    let content = htmlImporter.importDocument(html) || text
    if (content) {
      let editorSession = this.getEditorSession()
      editorSession.transaction((tx) => {
        tx.paste(content)
      }, { action: 'paste' })
    }
    return true
  }

  getEditorSession () {
    return this.editorSession
  }
}
