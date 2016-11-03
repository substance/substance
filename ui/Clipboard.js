import platform from '../util/platform'
import substanceGlobals from '../util/substanceGlobals'
import documentHelpers from '../model/documentHelpers'
import ClipboardImporter from './ClipboardImporter'
import ClipboardExporter from './ClipboardExporter'

/**
  The Clipboard is a Component which should be rendered as a sibling component
  of one or multiple Surfaces.

  It uses the JSONImporter and JSONExporter for internal copy'n'pasting,
  i.e., within one window or between two instances with the same DocumentSchema.

  For inter-application copy'n'paste, the ClipboardImporter and ClipboardExporter is used.

  @internal
*/
class Clipboard {

  constructor(surface, config) {
    this.surface = surface
    let doc = surface.getDocument()
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

  getSurface() {
    return this.surface
  }

  /*
    Called by to enable clipboard handling on a given root element.
  */
  attach(el) {
    el.on('copy', this.onCopy, this)
    el.on('cut', this.onCut, this)
    if (platform.isIE && !platform.isEdge) {
      el.on('beforepaste', this.onBeforePasteShim, this)
    } else {
      el.on('paste', this.onPaste, this)
    }
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
    let clipboardData = this.copy()
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
    Can be called from outside
  */
  copy() {
    let clipboardData = this._copy();
    // in the case that browser doesn't provide event.clipboardData
    // we keep the copied data for internal use.
    // Then we have copy'n'paste at least within one app
    Clipboard.clipboardData = clipboardData
    // FOR DEBUGGING
    substanceGlobals.clipboardData = clipboardData
    return clipboardData
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
    let surface = this.getSurface()
    if (!surface) return
    surface.transaction(function(tx, args) {
      return surface.delete(tx, args)
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
    console.log('onPaste(): received content types', types);

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
      if (Clipboard.NO_CATCH) {
        this._pasteHtml(html, plainText)
      } else {
        try {
          this._pasteHtml(html, plainText)
        } catch (err) {
          this._pastePlainText(plainText)
        }
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
    let surface = this.getSurface()
    surface.transaction(function(tx, args) {
      args.text = plainText
      return surface.paste(tx, args)
    })
  }

  onBeforePasteShim() {
    let surface = this.getSurface()
    if (!surface) return
    // console.log("Clipboard.onBeforePasteShim...");
    // HACK: need to work on the native element here
    let pasteEl = this._createPasteBin()
    let el = pasteEl.getNativeElement()
    el.focus()
    let range = window.document.createRange()
    range.setStart(el.firstChild, 0)
    range.setEnd(el.firstChild, 1)
    let wsel = window.getSelection()
    wsel.removeAllRanges()
    wsel.addRange(range)
  }

  // creates a contenteditable element which is used
  // to redirect a native paste into
  _createPasteBin() {
    let el = this.surface.el.createElement('div')
      .attr('contenteditable', true)
      .attr('tabindex', -1)
      .css({
        position: 'fixed',
        opacity: '0.0',
        bottom: '-1000px',
      })
      .append(" ")
      .on('beforepaste', function(event) {
        event.stopPropagation()
      })
      .on('paste', function(event) {
        this.onPasteShim(el)
        event.stopPropagation()
      }.bind(this))
    this.surface.el.appendChild(el)
    return el
  }

  onPasteShim(pasteEl) {
    // NOTE: this delay is necessary to let the browser paste into the paste bin
    window.setTimeout(function() {
      // console.log('Clipboard.onPasteShim()...');
      let html = pasteEl.innerHTML
      let text = pasteEl.textContent
      // console.log('### ... text: %s, html: %s', text, html);
      pasteEl.remove()
      // FOR DEBUGGING
      substanceGlobals.clipboardData = {
        text: text,
        html: html
      }
      if (Clipboard.NO_CATCH) {
        this._pasteHtml(html, text)
      } else {
        try {
          this._pasteHtml(html, text)
        } catch (err) {
          this._pastePlainText(text)
        }
      }
    }.bind(this))
  }

  /*
    Copies data from surface to clipboard.
  */
  _copy() {
    let surface = this.getSurface()
    let sel = surface.getSelection()
    let doc = surface.getDocument()
    let clipboardDoc = null
    let clipboardText = ""
    let clipboardHtml = ""
    if (!sel.isCollapsed()) {
      clipboardText = documentHelpers.getTextForSelection(doc, sel) || ""
      clipboardDoc = surface.copy(doc, sel)
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
    let surface = this.getSurface()
    if (!surface) return
    // TODO: the clipboard importer should make sure
    // that the container exists
    let content = this.htmlImporter.importDocument(html)
    this.paste(content, text)
  }

  /*
    Takes a clipboard document and pastes it at the current
    cursor position.

    Used by PasteCommand
  */
  paste(contentDoc, text) {
    // Use internal clipboard doc
    if (!contentDoc) {
      contentDoc = Clipboard.clipboardData.doc
    }

    let surface = this.getSurface()
    if (!surface) return
    // TODO: the clipboard importer should make sure
    // that the container exists

    if (contentDoc) {
      surface.transaction(function(tx, args) {
        args.text = text
        args.doc = contentDoc
        return surface.paste(tx, args)
      })
      return true
    }
  }

}

/*
  A shim for browsers with an unsupported native clipboard.
*/
Clipboard.clipboardData = {
  doc: null,
  html: "",
  text: ""
}

export default Clipboard
