'use strict';

var DOMExporter = require('./DOMExporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var extend = require('lodash/object/extend');
var each = require('lodash/collection/each');
var isBoolean = require('lodash/lang/isBoolean');
var isNumber = require('lodash/lang/isNumber');
var isString = require('lodash/lang/isString');

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
        var prop = this.$$(name);
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

module.exports = XMLExporter;
