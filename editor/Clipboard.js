import { platform } from '../util'
import { DefaultDOMElement } from '../dom'
import { documentHelpers, JSONConverter } from '../model'

const INLINENODES = ['a', 'b', 'big', 'i', 'small', 'tt', 'abbr', 'acronym', 'cite', 'code', 'dfn', 'em', 'kbd', 'strong', 'samp', 'time', 'var', 'bdo', 'br', 'img', 'map', 'object', 'q', 'script', 'span', 'sub', 'sup', 'button', 'input', 'label', 'select', 'textarea'].reduce((m, n) => { m[n] = true; return m }, {})

/*
  A rewrite of the original Substance.Clipboard, which uses a better JSONConverter implementation.
  Note: this should eventually moved back into Substance core.
*/
export default class Clipboard {
  copy (clipboardData, context) {
    // content specific manipulation API
    let editorSession = context.editorSession
    let snippet = editorSession.copy()
    this._setClipboardData(clipboardData, context, snippet)
  }

  cut (clipboardData, context) {
    let editorSession = context.editorSession
    let snippet = editorSession.cut()
    this._setClipboardData(clipboardData, context, snippet)
  }

  paste (clipboardData, context, options = {}) {
    let types = {}
    for (let i = 0; i < clipboardData.types.length; i++) {
      types[clipboardData.types[i]] = true
    }
    let html = types['text/html'] ? clipboardData.getData('text/html') : ''
    let success = false
    if (html && !options.plainTextOnly) {
      success = this._pasteHtml(html, context, options)
    }
    if (!success) {
      // in all other cases we fall back to plain-text
      let plainText = types['text/plain'] ? clipboardData.getData('text/plain') : ''
      this._pasteText(plainText, context, options)
    }
  }

  _setClipboardData (clipboardData, context, snippet) {
    let elements = this._createClipboardHtmlElements(context, snippet)
    let plainText = this._createClipboardText(context, snippet, elements)
    let html = this._createClipboardHtml(context, snippet, elements)
    clipboardData.setData('text/plain', plainText)
    if (html) {
      clipboardData.setData('text/html', html)
    }
  }

  _createClipboardHtmlElements (context, snippet) {
    let htmlExporter = context.config.createExporter('html')
    if (htmlExporter) {
      return htmlExporter.convertContainer(snippet, snippet.getContainer().getPath())
    }
  }

  _createClipboardText (context, snippet, htmlElements) {
    let config = context.config
    let textExporter = config.createExporter('text')
    if (textExporter) {
      return textExporter.exportNode(snippet.getContainer())
    } else if (htmlElements) {
      return htmlElements.map(el => el.textContent).join('\n')
    } else {
      return ''
    }
  }

  _createClipboardHtml (context, snippet, elements) {
    if (elements) {
      // special treatment for a text snippet
      let snippetHtml
      if (elements.length === 1 && elements[0].attr('data-id') === documentHelpers.TEXT_SNIPPET_ID) {
        snippetHtml = elements[0].innerHTML
      } else {
        snippetHtml = elements.map(el => {
          return el.outerHTML
        }).join('')
      }
      let jsonConverter = new JSONConverter()
      let jsonStr = JSON.stringify(jsonConverter.exportDocument(snippet))
      let substanceContent = `<script id="substance-clipboard" type="application/json">${jsonStr}</script>`
      let html = '<html><head>' + substanceContent + '</head><body>' + snippetHtml + '</body></html>'
      return html
    }
  }

  _pasteHtml (html, context, options = {}) {
    let htmlDoc
    try {
      htmlDoc = DefaultDOMElement.parseHTML(html)
    } catch (err) {
      console.error('Could not parse HTML received from the clipboard', err)
      return false
    }

    // when copying from a substance editor we store JSON in a script tag in the head
    // If the import fails e.g. because the schema is incompatible
    // we fall back to plain HTML import
    let snippet
    if (html.search(/script id=.substance-clipboard./) >= 0) {
      let substanceData = htmlDoc.find('#substance-clipboard')
      if (substanceData) {
        let jsonStr = substanceData.textContent
        try {
          snippet = this._importFromJSON(context, jsonStr)
        } finally {
          if (!snippet) {
            console.error('Could not convert clipboard content.')
          }
        }
      }
    }
    if (!snippet) {
      let state = {}
      Object.assign(state, this._detectApplicationType(html, htmlDoc))
      // Under windows and in Microsoft Word we can exploit the fact
      // that the paste content is wrapped inside <!--StartFragment--> and <!--EndFragment-->
      if (platform.isWindows || state.isMicrosoftWord) {
        // very strange: this was not working at some day
        // let match = /<!--StartFragment-->(.*)<!--EndFragment-->/.exec(html)
        // ... but still this
        const START_FRAGMENT = '<!--StartFragment-->'
        const END_FRAGMENT = '<!--EndFragment-->'
        let mStart = html.indexOf(START_FRAGMENT)
        if (mStart >= 0) {
          let mEnd = html.indexOf(END_FRAGMENT)
          let fragment = html.slice(mStart + START_FRAGMENT.length, mEnd)
          htmlDoc = DefaultDOMElement.parseHTML(fragment)
        }
      }
      // Note: because we are parsing the HTML not as snippet
      // the parser will always create a full HTML document
      // and there will always be a <body>
      // In case, the clipboard HTML is just a snippet
      // the body will contain the parsed snippet
      let bodyEl = htmlDoc.find('body')
      bodyEl = this._sanitizeBody(state, bodyEl)
      if (!bodyEl) {
        console.error('Invalid HTML.')
        return false
      }
      bodyEl = this._wrapIntoParagraph(bodyEl)
      snippet = context.editorSession.getDocument().createSnippet()
      let htmlImporter = context.config.createImporter('html', snippet)
      let container = snippet.get(documentHelpers.SNIPPET_ID)
      bodyEl.getChildren().forEach(el => {
        let node = htmlImporter.convertElement(el)
        if (node) {
          container.append(node.id)
        }
      })
    }
    return context.editorSession.paste(snippet, options)
  }

  _pasteText (text, context) {
    context.editorSession.insertText(text)
  }

  _importFromJSON (context, jsonStr) {
    let snippet = context.editorSession.getDocument().newInstance()
    let jsonData = JSON.parse(jsonStr)
    let converter = new JSONConverter()
    converter.importDocument(snippet, jsonData)
    return snippet
  }

  _detectApplicationType (html, htmlDoc) {
    let state = {}
    let generatorMeta = htmlDoc.find('meta[name="generator"]')
    let xmnlsw = htmlDoc.find('html').getAttribute('xmlns:w')
    if (generatorMeta) {
      let generator = generatorMeta.getAttribute('content')
      if (generator.indexOf('LibreOffice') > -1) {
        state.isLibreOffice = true
      }
    } else if (xmnlsw) {
      if (xmnlsw.indexOf('office:word') > -1) {
        state.isMicrosoftWord = true
      }
    } else if (html.indexOf('docs-internal-guid') > -1) {
      state.isGoogleDoc = true
    }
    return state
  }

  _sanitizeBody (state, body) {
    // Remove <meta> element
    body.findAll('meta').forEach(el => el.remove())
    // Some word processors are exporting new lines instead of spaces
    // for these editors we will replace all new lines with space
    if (state.isLibreOffice || state.isMicrosoftWord) {
      let bodyHtml = body.getInnerHTML()
      body.setInnerHTML(bodyHtml.replace(/\r\n|\r|\n/g, ' '))
    }
    if (state.isGoogleDoc) {
      body = this._fixupGoogleDocsBody(state, body)
    }
    return body
  }

  _fixupGoogleDocsBody (state, body) {
    if (!body) return
    // Google Docs has a strange convention to use a bold tag as
    // container for the copied elements
    // HACK: we exploit the fact that this element has an id with a
    // specific format, e.g., id="docs-internal-guid-5bea85da-43dc-fb06-e327-00c1c6576cf7"
    let bold = body.find('b')
    if (bold && /^docs-internal/.exec(bold.id)) {
      body = bold
    }
    // transformations to turn formatations encoded via styles
    // into semantic HTML tags
    body.findAll('span').forEach(span => {
      // Google Docs uses spans with inline styles
      // insted of inline nodes
      // We are scanning each span for certain inline styles:
      // font-weight: 700 -> <b>
      // font-style: italic -> <i>
      // vertical-align: super -> <sup>
      // vertical-align: sub -> <sub>
      // TODO: improve the result for other editors by fusing adjacent annotations of the same type
      let nodeTypes = []
      if (span.getStyle('font-weight') === '700') nodeTypes.push('b')
      if (span.getStyle('font-style') === 'italic') nodeTypes.push('i')
      if (span.getStyle('vertical-align') === 'super') nodeTypes.push('sup')
      if (span.getStyle('vertical-align') === 'sub') nodeTypes.push('sub')
      // remove the style so the element becomes cleaner
      span.removeAttribute('style')
      createInlineNodes(span.getParent(), true)

      function createInlineNodes (parentEl, isRoot) {
        if (nodeTypes.length > 0) {
          let el = parentEl.createElement(nodeTypes[0])
          if (nodeTypes.length === 1) el.append(span.textContent)
          if (isRoot) {
            parentEl.replaceChild(span, el)
          } else {
            parentEl.appendChild(el)
          }
          nodeTypes.shift()
          createInlineNodes(el)
        }
      }
    })

    // Union siblings with the same tags, e.g. we are turning
    // <b>str</b><b><i>ong</i></b> to <b>str<i>ong</i></b>
    let tags = ['b', 'i', 'sup', 'sub']
    tags.forEach(tag => {
      body.findAll(tag).forEach(el => {
        let previousSiblingEl = el.getPreviousSibling()
        if (previousSiblingEl && el.tagName === previousSiblingEl.tagName) {
          let parentEl = el.getParent()
          let newEl = parentEl.createElement(tag)
          newEl.setInnerHTML(previousSiblingEl.getInnerHTML() + el.getInnerHTML())
          parentEl.replaceChild(el, newEl)
          parentEl.removeChild(previousSiblingEl)
        }

        // Union siblings and child with the same tags, e.g. we are turning
        // <i>emph</i><b><i>asis</i></b> to <i>emph<b>asis</b></i>
        // Note that at this state children always have the same text content
        // e.g. there can't be cases like <b><i>emph</i> asis</b> so we don't treat them
        if (previousSiblingEl && previousSiblingEl.tagName && el.getChildCount() > 0 && el.getChildAt(0).tagName === previousSiblingEl.tagName) {
          let parentEl = el.getParent()
          let childEl = el.getChildAt(0)
          let newEl = parentEl.createElement(previousSiblingEl.tagName)
          let newChildEl = newEl.createElement(tag)
          newChildEl.setTextContent(childEl.textContent)
          newEl.appendChild(newChildEl)
          parentEl.replaceChild(el, newEl)
        }
      })
    })

    return body
  }

  // if the content only
  _wrapIntoParagraph (bodyEl) {
    let childNodes = bodyEl.getChildNodes()
    let shouldWrap = false
    for (let i = 0; i < childNodes.length; i++) {
      const c = childNodes[i]
      if (c.isTextNode()) {
        if (!(/^\s+$/.exec(c.textContent))) {
          shouldWrap = true
          break
        }
      } else if (INLINENODES[c.tagName]) {
        shouldWrap = true
        break
      }
    }
    if (shouldWrap) {
      let p = bodyEl.createElement('p')
      p.append(childNodes)
      bodyEl.append(p)
    }
    return bodyEl
  }
}
