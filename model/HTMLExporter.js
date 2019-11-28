import forEach from '../util/forEach'
import isBoolean from '../util/isBoolean'
import isNumber from '../util/isNumber'
import isString from '../util/isString'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import DOMExporter from './DOMExporter'

/*
  Base class for custom HTML exporters. If you want to use XML as your
  exchange format see {@link model/XMLExporter}.
*/

export default class HTMLExporter extends DOMExporter {
  constructor (params, options = {}) {
    super(_defaultParams(params, options), options)
  }

  exportDocument (doc) {
    const htmlEl = DefaultDOMElement.parseHTML('<html><head></head><body></body></html>')
    return this.convertDocument(doc, htmlEl)
  }

  getDefaultBlockConverter () {
    return defaultBlockConverter // eslint-disable-line no-use-before-define
  }

  getDefaultPropertyAnnotationConverter () {
    return defaultAnnotationConverter // eslint-disable-line no-use-before-define
  }
}

function _defaultParams (params, options) {
  params = Object.assign({
    idAttribute: 'data-id'
  }, params, options)
  if (!params.elementFactory) {
    params.elementFactory = DefaultDOMElement.createDocument('html')
  }
  return params
}

const defaultAnnotationConverter = {
  tagName: 'span',
  export: function (node, el) {
    el.tagName = 'span'
    el.attr('data-type', node.type)
    var properties = node.toJSON()
    forEach(properties, function (value, name) {
      if (name === 'id' || name === 'type') return
      if (isString(value) || isNumber(value) || isBoolean(value)) {
        el.attr('data-' + name, value)
      }
    })
  }
}

const defaultBlockConverter = {
  export: function (node, el, converter) {
    el.attr('data-type', node.type)
    const nodeSchema = node.getSchema()
    for (const prop of nodeSchema) {
      const name = prop.name
      if (name === 'id' || name === 'type') continue
      // using RDFa like attributes
      const propEl = converter.$$('div').attr('property', name)
      let value = node.get(name)
      if (prop.isText()) {
        propEl.append(converter.annotatedText([node.id, name]))
      } else if (prop.isReference()) {
        if (prop.isOwned()) {
          value = node.resolve(name)
          if (prop.isArray()) {
            propEl.append(value.map(child => converter.convertNode(child)))
          } else {
            propEl.append(converter.convertNode(value))
          }
        } else {
          // TODO: what to do with relations? maybe create a link pointing to the real one?
          // or render a label of the other
          // For now, we skip such props
          continue
        }
      } else {
        propEl.append(String(value))
      }
      el.append(propEl)
    }
  }
}
