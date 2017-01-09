import DOMExporter from './DOMExporter'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import forEach from '../util/forEach'
import isBoolean from '../util/isBoolean'
import isNumber from '../util/isNumber'
import isString from '../util/isString'

var defaultAnnotationConverter = {
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

var defaultBlockConverter = {
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

/*
  @class
  @abstract

  Base class for custom HTML exporters. If you want to use XML as your
  exchange format see {@link model/XMLExporter}.
*/

class HTMLExporter extends DOMExporter {

  constructor(config) {
    super(Object.assign({ idAttribute: 'data-id' }, config))

    // used internally for creating elements
    this._el = DefaultDOMElement.parseHTML('<html></html>')
  }

  exportDocument(doc) {
    let htmlEl = DefaultDOMElement.parseHTML('<html><head></head><body></body></html>')
    return this.convertDocument(doc, htmlEl)
  }

  getDefaultBlockConverter() {
    return defaultBlockConverter
  }

  getDefaultPropertyAnnotationConverter() {
    return defaultAnnotationConverter
  }

}

export default HTMLExporter
