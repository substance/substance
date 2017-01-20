import forEach from '../util/forEach'
import isBoolean from '../util/isBoolean'
import isNumber from '../util/isNumber'
import isString from '../util/isString'
import DOMExporter from './DOMExporter'
import DefaultDOMElement from '../dom/DefaultDOMElement'

/*
  Base class for custom XML exporters. If you want to use HTML as your
  exchange format see {@link model/HTMLExporter}.
*/
class XMLExporter extends DOMExporter {

  constructor(config, context) {
    super(_defaultConfig(config), context)
  }

  getDefaultBlockConverter() {
    return defaultBlockConverter // eslint-disable-line no-use-before-define
  }

  getDefaultPropertyAnnotationConverter() {
    return defaultAnnotationConverter // eslint-disable-line no-use-before-define
  }

}

function _defaultConfig(config) {
  config = Object.assign({
    idAttribute: 'id'
  }, config)
  if (!config.elementFactory) {
    config.elementFactory = DefaultDOMElement.createDocument('xml')
  }
  return config
}

const defaultAnnotationConverter = {
  tagName: 'annotation',
  export: function(node, el) {
    el.attr('type', node.type)
    const properties = node.toJSON()
    forEach(properties, function(value, name) {
      if (name === 'id' || name === 'type') return
      if (isString(value) || isNumber(value) || isBoolean(value)) {
        el.attr(name, value)
      }
    })
  }
}

const defaultBlockConverter = {
  tagName: 'block',
  export: function(node, el, converter) {
    el.attr('type', node.type)
    const properties = node.toJSON()
    forEach(properties, function(value, name) {
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

export default XMLExporter
