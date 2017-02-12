import isString from '../util/isString'
import isFunction from '../util/isFunction'
import Registry from '../util/Registry'
import Fragmenter from './Fragmenter'
import encodeXMLEntities from '../util/encodeXMLEntities'

class DOMExporter {

  constructor(config, context) {
    this.context = context || {}
    if (!config.converters) {
      throw new Error('config.converters is mandatory')
    }
    if (!config.converters._isRegistry) {
      this.converters = new Registry()
      config.converters.forEach(function(Converter) {
        let converter = isFunction(Converter) ? new Converter() : Converter
        if (!converter.type) {
          console.error('Converter must provide the type of the associated node.', converter)
          return
        }
        this.converters.add(converter.type, converter)
      }.bind(this))
    } else {
      this.converters = config.converters
    }

    this.state = {
      doc: null
    }
    this.config = config
    // NOTE: Subclasses (HTMLExporter and XMLExporter) must initialize this
    // with a proper DOMElement instance which is used to create new elements.
    this._elementFactory = config.elementFactory
    if (!this._elementFactory) {
      throw new Error("'elementFactory' is mandatory")
    }
    this.$$ = this.createElement.bind(this)
  }

  exportDocument(doc) {
    // TODO: this is no left without much functionality
    // still, it would be good to have a consistent top-level API
    // i.e. converter.importDocument(el) and converter.exportDocument(doc)
    // On the other side, the 'internal' API methods are named this.convert*.
    return this.convertDocument(doc)
  }

  /**
    @param {Document}
    @returns {DOMElement|DOMElement[]} The exported document as DOM or an array of elements
             if exported as partial, which depends on the actual implementation
             of `this.convertDocument()`.

    @abstract
    @example

    convertDocument(doc) {
      var elements = this.convertContainer(doc, this.state.containerId)
      var out = elements.map(function(el) {
        return el.outerHTML
      })
      return out.join('')
    }
  */
  convertDocument(doc) { // eslint-disable-line
    throw new Error('This method is abstract')
  }

  convertContainer(container) {
    if (!container) {
      throw new Error('Illegal arguments: container is mandatory.')
    }
    var doc = container.getDocument()
    this.state.doc = doc
    var elements = []
    container.nodes.forEach(function(id) {
      var node = doc.get(id)
      var nodeEl = this.convertNode(node)
      elements.push(nodeEl)
    }.bind(this))
    return elements
  }

  convertNode(node) {
    if (isString(node)) {
      // Assuming this.state.doc has been set by convertDocument
      node = this.state.doc.get(node)
    } else {
      this.state.doc = node.getDocument()
    }
    var converter = this.getNodeConverter(node)
    // special treatment for annotations, i.e. if someone calls
    // `exporter.convertNode(anno)`
    if (node._isPropertyAnnotation && (!converter || !converter.export)) {
      return this._convertPropertyAnnotation(node)
    }
    if (!converter) {
      converter = this.getDefaultBlockConverter()
    }
    var el
    if (converter.tagName) {
      el = this.$$(converter.tagName)
    } else {
      el = this.$$('div')
    }
    el.attr(this.config.idAttribute, node.id)
    if (converter.export) {
      el = converter.export(node, el, this) || el
    } else {
      el = this.getDefaultBlockConverter().export(node, el, this) || el
    }
    return el
  }

  convertProperty(doc, path, options) {
    this.initialize(doc, options)
    var wrapper = this.$$('div')
      .append(this.annotatedText(path))
    return wrapper.innerHTML
  }

  annotatedText(path) {
    var doc = this.state.doc
    var text = doc.get(path)
    var annotations = doc.getIndex('annotations').get(path)
    return this._annotatedText(text, annotations)
  }

  getNodeConverter(node) {
    return this.converters.get(node.type)
  }

  getDefaultBlockConverter() {
    throw new Error('This method is abstract.')
  }

  getDefaultPropertyAnnotationConverter() {
    throw new Error('This method is abstract.')
  }

  getDocument() {
    return this.state.doc
  }

  createElement(str) {
    return this._elementFactory.createElement(str)
  }

  _annotatedText(text, annotations) {
    var self = this

    var annotator = new Fragmenter()
    annotator.onText = function(context, text) {
      context.children.push(encodeXMLEntities(text))
    }
    annotator.onEnter = function(fragment) {
      var anno = fragment.node
      return {
        annotation: anno,
        children: []
      }
    }
    annotator.onExit = function(fragment, context, parentContext) {
      var anno = context.annotation
      var converter = self.getNodeConverter(anno)
      if (!converter) {
        converter = self.getDefaultPropertyAnnotationConverter()
      }
      var el
      if (converter.tagName) {
        el = this.$$(converter.tagName)
      } else {
        el = this.$$('span')
      }
      el.attr(this.config.idAttribute, anno.id)
      el.append(context.children)
      if (converter.export) {
        el = converter.export(anno, el, self) || el
      }
      parentContext.children.push(el)
    }.bind(this)
    var wrapper = { children: [] }
    annotator.start(wrapper, text, annotations)
    return wrapper.children
  }

  /*
    This is used when someone calls `exporter.convertNode(anno)`
    Usually, annotations are converted by calling exporter.annotatedText(path).
    Still it makes sense to be able to export just a fragment containing just
    the annotation element.
  */
  _convertPropertyAnnotation(anno) {
    // take only the annotations within the range of the anno
    var wrapper = this.$$('div').append(this.annotatedText(anno.path))
    var el = wrapper.find('['+this.config.idAttribute+'="'+anno.id+'"]')
    return el
  }

}

export default DOMExporter
