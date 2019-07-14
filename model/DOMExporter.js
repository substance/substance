import isFunction from '../util/isFunction'
import encodeXMLEntities from '../util/encodeXMLEntities'
import Registry from '../util/Registry'
import Fragmenter from './Fragmenter'

export default class DOMExporter {
  constructor (params, options = {}) {
    if (!params.converters) {
      throw new Error('params.converters is mandatory')
    }
    // NOTE: Subclasses (HTMLExporter and XMLExporter) must initialize this
    // with a proper DOMElement instance which is used to create new elements.
    if (!params.elementFactory) {
      throw new Error("'elementFactory' is mandatory")
    }
    this.converters = new Registry()
    params.converters.forEach(Converter => {
      let converter = isFunction(Converter) ? new Converter() : Converter
      if (!converter.type) {
        console.error('Converter must provide the type of the associated node.', converter)
        return
      }
      this.converters.add(converter.type, converter)
    })
    this.elementFactory = params.elementFactory
    this.idAttribute = params.idAttribute || 'id'
    this.state = { doc: null }
    this.options = options
    this.$$ = this.createElement.bind(this)
  }

  exportDocument (doc) {
    // TODO: this is no left without much functionality
    // still, it would be good to have a consistent top-level API
    // i.e. converter.importDocument(el) and converter.exportDocument(doc)
    // On the other side, the 'internal' API methods are named this.convert*.
    return this.convertDocument(doc)
  }

  /**
   * @param {Document}
   * @returns {DOMElement|DOMElement[]} The exported document as DOM or an array of elements
   *          if exported as partial, which depends on the actual implementation
   *          of `this.convertDocument()`.
   *
   * @abstract
   * @example
   *
   * convertDocument(doc) {
   *   let container = doc.get('body')
   *   let elements = this.convertContainer(container)
   *   let out = elements.map(el => {
   *     return el.outerHTML
   *   })
   *   return out.join('')
   * }
   */
  convertDocument(doc) { // eslint-disable-line
    throw new Error('This method is abstract')
  }

  convertContainer (doc, containerPath) {
    if (!containerPath) {
      throw new Error('Illegal arguments: containerPath is mandatory.')
    }
    this.state.doc = doc
    let ids = doc.get(containerPath)
    let elements = ids.map(id => {
      let node = doc.get(id)
      return this.convertNode(node)
    })
    return elements
  }

  convertNode (node) {
    this.state.doc = node.getDocument()
    let converter = this.getNodeConverter(node)
    // special treatment for annotations, i.e. if someone calls
    // `exporter.convertNode(anno)`
    if (node.isPropertyAnnotation() && (!converter || !converter.export)) {
      return this._convertPropertyAnnotation(node)
    }
    if (!converter) {
      converter = this.getDefaultBlockConverter()
    }
    let el
    if (converter.tagName) {
      el = this.$$(converter.tagName)
    } else {
      el = this.$$('div')
    }
    el.attr(this.idAttribute, node.id)
    if (converter.export) {
      el = converter.export(node, el, this) || el
    } else {
      el = this.getDefaultBlockConverter().export(node, el, this) || el
    }
    return el
  }

  convertProperty (doc, path, options) {
    this.state.doc = doc
    this.initialize(doc, options)
    let wrapper = this.$$('div')
      .append(this.annotatedText(path))
    return wrapper.innerHTML
  }

  annotatedText (path, doc) {
    doc = doc || this.state.doc
    let text = doc.get(path)
    let annotations = doc.getIndex('annotations').get(path)
    return this._annotatedText(text, annotations)
  }

  getNodeConverter (node) {
    return this.converters.get(node.type)
  }

  getDefaultBlockConverter () {
    throw new Error('This method is abstract.')
  }

  getDefaultPropertyAnnotationConverter () {
    throw new Error('This method is abstract.')
  }

  getDocument () {
    return this.state.doc
  }

  createElement (str) {
    return this.elementFactory.createElement(str)
  }

  _annotatedText (text, annotations) {
    let annotator = new Fragmenter()
    annotator.onText = (context, text) => {
      if (text) {
        // ATTENTION: only encode if this is desired, e.g. '"' would be encoded as '&quot;' but as Clipboard HTML this is not understood by
        // other applications such as Word.
        if (this.options.ENCODE_ENTITIES_IN_TEXT) {
          text = encodeXMLEntities(text)
        }
        context.children.push(text)
      }
    }
    annotator.onOpen = function (fragment) {
      return {
        children: []
      }
    }
    annotator.onClose = (fragment, context, parentContext) => {
      let anno = fragment.node
      let converter = this.getNodeConverter(anno)
      if (!converter) {
        converter = this.getDefaultPropertyAnnotationConverter()
      }
      let el
      if (converter.tagName) {
        el = this.$$(converter.tagName)
      } else {
        el = this.$$('span')
      }
      el.attr(this.idAttribute, anno.id)
      // inline nodes are special, because they are like an island in the text:
      // In a Substance TextNode, an InlineNode is anchored on an invisible character.
      // In the XML presentation, however, this character must not be inserted, instead the element
      // converted and then inserted at the very same location.
      if (anno.isInlineNode()) {
        if (converter.export) {
          el = converter.export(anno, el, this) || el
        } else {
          el = this.convertNode(anno) || el
        }
      } else if (anno.isAnnotation()) {
        // allowing to provide a custom exporter
        // ATTENTION: a converter for the children of an annotation must not be
        if (converter.export) {
          el = converter.export(anno, el, this) || el
          if (el.children.length) {
            throw new Error('A converter for an annotation type must not convert children. The content of an annotation is owned by their TextNode.')
          }
        }
        el.append(context.children)
      } else {
        // TODO: this should not be possible from the beginning. Seeing this error here, is pretty late.
        throw new Error('Illegal element type: only inline nodes and annotations are allowed within a TextNode')
      }
      parentContext.children.push(el)
    }
    let wrapper = { children: [] }
    annotator.start(wrapper, text, annotations)
    return wrapper.children
  }

  /*
    This is used when someone calls `exporter.convertNode(anno)`
    Usually, annotations are converted by calling exporter.annotatedText(path).
    Still it makes sense to be able to export just a fragment containing just
    the annotation element.
  */
  _convertPropertyAnnotation (anno) {
    // take only the annotations within the range of the anno
    let wrapper = this.$$('div').append(this.annotatedText(anno.path))
    let el = wrapper.find('[' + this.idAttribute + '="' + anno.id + '"]')
    return el
  }
}
