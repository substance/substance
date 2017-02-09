import extend from '../util/extend'
import isArray from '../util/isArray'
import forEach from '../util/forEach'
import Registry from '../util/Registry'
import Document from '../model/Document'
import HTMLImporter from '../model/HTMLImporter'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import JSONConverter from '../model/JSONConverter'
import platform from '../util/platform'

/**
  Import HTML from clipboard. Used for inter-application copy'n'paste.

  @internal
*/
class ClipboardImporter extends HTMLImporter {

  constructor(config) {
    ClipboardImporter._addConverters(config)

    if (!config.schema) {
      throw new Error('Missing argument: config.schema is required.')
    }

    super(config)
    // disabling warnings about default importers
    this.IGNORE_DEFAULT_WARNINGS = true

    extend(config, {
      trimWhitespaces: true,
      REMOVE_INNER_WS: true
    })

    // ATTENTION: this is only here so we can enfore windows conversion
    // mode from within tests
    this._isWindows = platform.isWindows

    this._emptyDoc = this._createDocument(this.schema)
  }

  /**
    Parses HTML and applies some sanitization/normalization.
  */
  importDocument(html) {
    let body, el

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
      el = DefaultDOMElement.parseHTML(html)
      let substanceData = el.find('#substance-clipboard')
      if (substanceData) {
        let jsonStr = substanceData.textContent
        try {
          return this.importFromJSON(jsonStr)
        } catch(err) {
          console.error(err)
        }
      }
    }

    el = DefaultDOMElement.parseHTML(html)
    if (isArray(el)) {
      body = this._createElement('body')
      body.append(el)
    } else {
      body = el.find('body')
    }
    if (!body) {
      body = this._createElement('body')
      body.append(el)
    }
    body = this._sanitizeBody(body)
    if (!body) {
      console.warn('Invalid HTML.')
      return null
    }

    this.reset()
    this.convertBody(body)
    let doc = this.generateDocument()
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
      return bold
    }
    return body
  }

  importFromJSON(jsonStr) {
    let doc = this.createDocument()
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

  _wrapInlineElementsIntoBlockElement(childIterator) {
    let wrapper = this._createElement('p')
    while(childIterator.hasNext()) {
      let el = childIterator.next()
      // if there is a block node we finish this wrapper
      let blockTypeConverter = this._getConverterForElement(el, 'block')
      if (blockTypeConverter) {
        childIterator.back()
        break
      }
      wrapper.append(el.clone(true))
    }
    // HACK: usually when we run into this case, then there is inline data only
    // Instead of detecting this case up-front we just set the proper id
    // and hope that all goes well.
    // Note: when this is called a second time, the id will be overridden.
    wrapper.attr('data-id', Document.TEXT_SNIPPET_ID)
    let node = this.defaultConverter(wrapper, this)
    if (node) {
      if (!node.type) {
        throw new Error('Contract: Html.defaultConverter() must return a node with type.')
      }
      this._createAndShow(node)
    }
    return node
  }

  /**
    Creates substance document to paste.

    @return {Document} the document instance
  */
  createDocument() {
    return this._emptyDoc.createSnippet()
  }

  _getUnsupportedNodeConverter() {
    // nothing
  }

}

const CONVERTERS = {
  'catch-all-block': {
    type: 'paragraph',
    matchElement: function(el) { return el.is('div') },
    import: function(el, node, converter) {
      node.content = converter.annotatedText(el, [node.id, 'content'])
    }
  }
}

ClipboardImporter._addConverters = function(config) {
  if (config.converters) {
    let registry = new Registry()
    config.converters.forEach(function(conv, name) {
      registry.add(name, conv)
    });
    forEach(CONVERTERS, function(converter, name) {
      registry.add(name, converter)
    });
    config.converters = registry
  }
}

export default ClipboardImporter
