'use strict';

var DOMExporter = require('./DOMExporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var extend = require('lodash/object/extend');
var each = require('lodash/collection/each');
var isBoolean = require('lodash/lang/isBoolean');
var isNumber = require('lodash/lang/isNumber');
var isString = require('lodash/lang/isString');

/**
  @class
  @abstract

  Base class for custom HTML exporters. If you want to use XML as your
  exchange format see {@link model/XMLExporter}.

  @example

  Below is a full example taken from the [Notepad](https://github.com/substance/examples/blob/master/converter/NoteExporter.js) example.

  ```js
  var HTMLExporter = require('substance/model/HTMLExporter');
  var converters = require('./NoteImporter').converters;

  function NoteExporter() {
    NoteExporter.super.call(this, {
      converters: converters,
      containerId: 'body'
    });
  }

  HTMLExporter.extend(NoteExporter);
  ```
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
      el = el.withTagName('span');
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
        if (node.getPropertyType(name) === 'string') {
          // only convert the property if value is not empty
          if (value) {
            prop.append(converter.annotatedText([node.id, name]));
          }
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

module.exports = HTMLExporter;
