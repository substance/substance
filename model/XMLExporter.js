import forEach from '../util/forEach'
import isBoolean from '../util/isBoolean'
import isNumber from '../util/isNumber'
import isString from '../util/isString'
import DOMExporter from './DOMExporter'
import DefaultDOMElement from '../dom/DefaultDOMElement'

var defaultAnnotationConverter = {
  tagName: 'annotation',
  export: function(node, el) {
    el.attr('type', node.type)
    var properties = node.toJSON()
    forEach(properties, function(value, name) {
      if (name === 'id' || name === 'type') return
      if (isString(value) || isNumber(value) || isBoolean(value)) {
        el.attr(name, value)
      }
    })
  }
}

var defaultBlockConverter = {
  tagName: 'block',
  export: function(node, el, converter) {
    el.attr('type', node.type)
    var properties = node.toJSON()
    forEach(properties, function(value, name) {
      if (name === 'id' || name === 'type') {
        return
      }
      var prop = converter.$$(name)
      if (node.getPropertyType(name) === 'string') {
        prop.append(converter.annotatedText([node.id, name]))
      } else {
        prop.text(value)
      }
      el.append(prop)
    })
  }
}

/*
  @class
  @abstract

  Base class for custom XML exporters. If you want to use HTML as your
  exchange format see {@link model/HTMLExporter}.
*/
class XMLExporter extends DOMExporter {

  constructor(config, context) {
    super(Object.assign({ idAttribute: 'id' }, config), context)

    // used internally for creating elements
    this._el = DefaultDOMElement.parseXML('<dummy></dummy>')
  }

  getDefaultBlockConverter() {
    return defaultBlockConverter
  }

  getDefaultPropertyAnnotationConverter() {
    return defaultAnnotationConverter
  }

}

export default XMLExporter
