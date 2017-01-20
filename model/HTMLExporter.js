import DOMExporter from './DOMExporter'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import forEach from '../util/forEach'
import isBoolean from '../util/isBoolean'
import isNumber from '../util/isNumber'
import isString from '../util/isString'

/*
  Base class for custom HTML exporters. If you want to use XML as your
  exchange format see {@link model/XMLExporter}.
*/

class HTMLExporter extends DOMExporter {

  constructor(config, context) {
    super(_defaultConfig(config), context)
  }

  exportDocument(doc) {
    let htmlEl = DefaultDOMElement.parseHTML('<html><head></head><body></body></html>')
    return this.convertDocument(doc, htmlEl)
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
    idAttribute: 'data-id'
  }, config)
  if (!config.elementFactory) {
    config.elementFactory = DefaultDOMElement.createDocument('html')
  }
  return config
}


const defaultAnnotationConverter = {
  tagName: 'span',
  export: function(node, el) {
    el.tagName = 'span'
    el.attr('data-type', node.type)
    var properties = node.toJSON()
    forEach(properties, function(value, name) {
      if (name === 'id' || name === 'type') return
      if (isString(value) || isNumber(value) || isBoolean(value)) {
        el.attr('data-'+name, value)
      }
    })
  }
}

const defaultBlockConverter = {
  export: function(node, el, converter) {
    el.attr('data-type', node.type)
    var properties = node.toJSON()
    forEach(properties, function(value, name) {
      if (name === 'id' || name === 'type') {
        return
      }
      var prop = converter.$$('div').attr('property', name)
      if (node.getPropertyType(name) === 'string' && value) {
        prop.append(converter.annotatedText([node.id, name]))
      } else {
        prop.text(value)
      }
      el.append(prop)
    })
  }
}

export default HTMLExporter
