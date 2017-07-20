import { DefaultDOMElement } from '../dom'
import { platform } from '../util'
import { Document, HTMLImporter, JSONConverter } from '../model'

const INLINENODES = ['a','b','big','i','small','tt','abbr','acronym','cite','code','dfn','em','kbd','strong','samp','time','var','bdo','br','img','map','object','q','script','span','sub','sup','button','input','label','select','textarea'].reduce((m,n)=>{m[n]=true;return m}, {})

/**
  Import HTML from clipboard. Used for inter-application copy'n'paste.

  @internal
*/
export default
class ClipboardImporter extends HTMLImporter {

  constructor(config) {
    super(_withCatchAllConverter(config))
    // disabling warnings about default importers
    this.IGNORE_DEFAULT_WARNINGS = true

    Object.assign(config, {
      trimWhitespaces: true,
      REMOVE_INNER_WS: true
    })

    // ATTENTION: this is only here so we can enfore windows conversion
    // mode from within tests
    this._isWindows = platform.isWindows
    this.editorOptions = config.editorOptions
  }

  /**
    Parses HTML and applies some sanitization/normalization.
  */
  importDocument(html) {
    if (this._isWindows) {
      // Under windows we can exploit <!--StartFragment--> and <!--EndFragment-->
      // to have an easier life
      let match = /<!--StartFragment-->(.*)<!--EndFragment-->/.exec(html)
      if (match) {
        html = match[1]
      }
    }

    // when copying from a substance editor we store JSON in a script tag in the head
    // If the import fails e.g. because the schema is incompatible
    // we fall back to plain HTML import
    if (html.search(/script id=.substance-clipboard./)>=0) {
      let htmlDoc = DefaultDOMElement.parseHTML(html)
      let substanceData = htmlDoc.find('#substance-clipboard')
      if (substanceData) {
        let jsonStr = substanceData.textContent
        try {
          return this.importFromJSON(jsonStr)
        } finally {
          // nothing
        }
      }
    }

    if (this.editorOptions && this.editorOptions['forcePlainTextPaste']) {
      return null;
    }

    let htmlDoc = DefaultDOMElement.parseHTML(html)
    let body = htmlDoc.find('body')
    body = this._sanitizeBody(body)
    if (!body) {
      console.warn('Invalid HTML.')
      return null
    }
    this._wrapIntoParagraph(body)
    this.reset()
    this.convertBody(body)
    const doc = this.state.doc
    return doc
  }

  _sanitizeBody(body) {
    body = this._fixupGoogleDocsBody(body)
    // Remove <meta> element
    body.findAll('meta').forEach(el => el.remove())
    return body
  }

  _fixupGoogleDocsBody(body) {
    if (!body) return
    // Google Docs has a strange convention to use a bold tag as
    // container for the copied elements
    // HACK: we exploit the fact that this element has an id with a
    // specific format, e.g., id="docs-internal-guid-5bea85da-43dc-fb06-e327-00c1c6576cf7"
    let bold = body.find('b')
    if (bold && /^docs-internal/.exec(bold.id)) {
      body = bold
    }

    body.findAll('span').forEach(span => {
      // Google Docs uses spans with inline styles 
      // insted of inline nodes
      // We are scanning each span for certain inline styles:
      // font-weight: 700 -> <b>
      // font-style: italic -> <i>
      // vertical-align: super -> <sup>
      // vertical-align: sub -> <sub>

      let nodeTypes = []
      if(span.getStyle('font-weight') === '700') nodeTypes.push('b')
      if(span.getStyle('font-style') === 'italic') nodeTypes.push('i')
      if(span.getStyle('vertical-align') === 'super') nodeTypes.push('sup')
      if(span.getStyle('vertical-align') === 'sub') nodeTypes.push('sub')

      function createInlineNodes(parentEl, isRoot) {
        if(nodeTypes.length > 0) {
          let el = parentEl.createElement(nodeTypes[0])
          if(nodeTypes.length === 1) el.append(span.textContent)

          if(isRoot) {
            parentEl.replaceChild(span, el)
          } else {
            parentEl.appendChild(el)
          }

          nodeTypes.shift()
          createInlineNodes(el)
        }
      }

      createInlineNodes(span.getParent(), true)
    })

    let tags = ['b', 'i', 'sup', 'sub']

    tags.forEach(tag => {
      body.findAll(tag).forEach(el => {
        // Union siblings with the same tags, e.g. we are turning 
        // <b>str</b><b><i>ong</i></b> to <b>str<i>ong</i></b>
        let previousSiblingEl = el.getPreviousSibling()
        if(previousSiblingEl && el.tagName === previousSiblingEl.tagName) {
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
        if(previousSiblingEl && previousSiblingEl.tagName && el.getChildCount() > 0 && el.getChildAt(0).tagName === previousSiblingEl.tagName) {
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

  _wrapIntoParagraph(body) {
    let childNodes = body.getChildNodes()
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
      let p = body.createElement('p')
      p.append(childNodes)
      body.append(p)
    }
  }

  importFromJSON(jsonStr) {
    this.reset()
    let doc = this.getDocument()
    let jsonData = JSON.parse(jsonStr)
    let converter = new JSONConverter()
    converter.importDocument(doc, jsonData)
    return doc
  }

  /**
    Converts all children of a given body element.

    @param {String} body body element of given HTML document
  */
  convertBody(body) {
    this.convertContainer(body.childNodes, Document.SNIPPET_ID)
  }

  /**
    Creates substance document to paste.

    @return {Document} the document instance
  */
  _createDocument() {
    let emptyDoc = super._createDocument()
    return emptyDoc.createSnippet()
  }
}

function _withCatchAllConverter(config) {
  config = Object.assign({}, config)
  let defaultTextType = config.schema.getDefaultTextType()
  config.converters = config.converters.concat([{
    type: defaultTextType,
    matchElement: function(el) { return el.is('div') },
    import: function(el, node, converter) {
      node.content = converter.annotatedText(el, [node.id, 'content'])
    }
  }])
  return config
}
