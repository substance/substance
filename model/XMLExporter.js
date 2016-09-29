'use strict';

import DOMExporter from './DOMExporter'
import DefaultDOMElement from '../ui/DefaultDOMElement'
import extend from 'lodash/extend'
import each from 'lodash/each'
import isBoolean from 'lodash/isBoolean'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'

/*
  @class
  @abstract

  Base class for custom XML exporters. If you want to use HTML as your
  exchange format see {@link model/HTMLExporter}.
*/

function XMLExporter(config) {
  config = extend({ idAttribute: 'id' }, config);
  DOMExporter.call(this, config);

  // used internally for creating elements
  this._el = DefaultDOMElement.parseXML('<dummy></dummy>');
}

XMLExporter.Prototype = function() {

  var defaultAnnotationConverter = {
    tagName: 'annotation',
    export: function(node, el) {
      el.attr('type', node.type);
      var properties = node.toJSON();
      each(properties, function(value, name) {
        if (name === 'id' || name === 'type') return;
        if (isString(value) || isNumber(value) || isBoolean(value)) {
          el.attr(name, value);
        }
      });
    }
  };

  var defaultBlockConverter = {
    tagName: 'block',
    export: function(node, el, converter) {
      el.attr('type', node.type);
      var properties = node.toJSON();
      each(properties, function(value, name) {
        if (name === 'id' || name === 'type') {
          return;
        }
        var prop = converter.$$(name);
        if (node.getPropertyType(name) === 'string') {
          prop.append(converter.annotatedText([node.id, name]));
        } else {
          prop.text(value);
        }
        el.append(prop);
      });
    }
  };

  this.getDefaultBlockConverter = function() {
    return defaultBlockConverter;
  };

  this.getDefaultPropertyAnnotationConverter = function() {
    return defaultAnnotationConverter;
  };

};

DOMExporter.extend(XMLExporter);

export default XMLExporter;
