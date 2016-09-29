'use strict';

import DOMExporter from './DOMExporter'
import DefaultDOMElement from '../ui/DefaultDOMElement'
import extend from 'lodash/extend'
import each from 'lodash/each'
import isBoolean from 'lodash/isBoolean'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'

/*
  Base class for custom HTML exporters. If you want to use XML as your
  exchange format see {@link model/XMLExporter}.

  @class
  @abstract
*/
function HTMLExporter(config) {
  config = extend({ idAttribute: 'data-id' }, config);
  DOMExporter.call(this, config);

  // used internally for creating elements
  this._el = DefaultDOMElement.parseHTML('<html></html>');
}

HTMLExporter.Prototype = function() {

  this.exportDocument = function(doc) {
    var htmlEl = DefaultDOMElement.parseHTML('<html><head></head><body></body></html>');
    return this.convertDocument(doc, htmlEl);
  };

  var defaultAnnotationConverter = {
    tagName: 'span',
    export: function(node, el) {
      el.tagName = 'span';
      el.attr('data-type', node.type);
      var properties = node.toJSON();
      each(properties, function(value, name) {
        if (name === 'id' || name === 'type') return;
        if (isString(value) || isNumber(value) || isBoolean(value)) {
          el.attr('data-'+name, value);
        }
      });
    }
  };

  var defaultBlockConverter = {
    export: function(node, el, converter) {
      el.attr('data-type', node.type);
      var properties = node.toJSON();
      each(properties, function(value, name) {
        if (name === 'id' || name === 'type') {
          return;
        }
        var prop = converter.$$('div').attr('property', name);
        if (node.getPropertyType(name) === 'string' && value) {
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

DOMExporter.extend(HTMLExporter);

export default HTMLExporter;
