import forEach from '../util/forEach'
import isBoolean from '../util/isBoolean'
import isNumber from '../util/isNumber'
import isString from '../util/isString'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import DOMExporter from './DOMExporter'

/*
  Base class for custom XML exporters. If you want to use HTML as your
  exchange format see {@link model/HTMLExporter}.
*/
export default class XMLExporter extends DOMExporter {
  constructor (params, options = {}) {
    super(_defaultParams(params, options), options)
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
    idAttribute: 'id'
  }, params, options)
  if (!params.elementFactory) {
    const xmlParams = {
      version: options.xmlVersion || '1.0',
      encoding: options.xmlEncoding || 'UTF-8'
    }
    params.elementFactory = DefaultDOMElement.createDocument('xml', xmlParams)
  }
  return params
}

const defaultAnnotationConverter = {
  tagName: 'annotation',
  export: function (node, el) {
    el.attr('type', node.type)
    const properties = node.toJSON()
    forEach(properties, function (value, name) {
      if (name === 'id' || name === 'type') return
      if (isString(value) || isNumber(value) || isBoolean(value)) {
        el.attr(name, value)
      }
    })
  }
}

const defaultBlockConverter = {
  tagName: 'block',
  export: function (node, el, converter) {
    el.attr('type', node.type)
    const properties = node.toJSON()
    forEach(properties, function (value, name) {
      if (name === 'id' || name === 'type') {
        return
      }
      const prop = converter.$$(name)
      if (node.getPropertyType(name) === 'string') {
        prop.append(converter.annotatedText([node.id, name]))
      } else {
        prop.text(value)
      }
      el.append(prop)
    })
  }
}
