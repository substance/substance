'use strict';

var extend = require('lodash/extend');
var each = require('lodash/each');
var isBoolean = require('lodash/isBoolean');
var isNumber = require('lodash/isNumber');
var DOMExporter = require('./DOMExporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var isString = require('../util/isString');

/**
  @class
  @abstract

  Base class for custom XML exporters. If you want to use HTML as your
  exchange format see {@link model/HTMLExporter}.

  @example

  Below is a full example taken from [Lens](https://github.com/substance/lens/blob/master/model/LensArticleExporter.js).

  ```js
  var XMLExporter = require('substance/model/XMLExporter');
  var converters = require('./LensArticleImporter').converters;
  var each = require('lodash/each');

  function LensArticleExporter() {
    LensArticleExporter.super.call(this, {
      converters: converters,
      containerId: 'main'
    });
  }

  LensArticleExporter.Prototype = function() {
    this.exportDocument = function(doc) {
      this.state.doc = doc;
      var $$ = this.$$;
      var articleEl = $$('article');

      // Export ArticleMeta
      var metaEl = this.convertNode(doc.get('article-meta'));
      articleEl.append(metaEl);

      // Export resources (e.g. bib items)
      var resourceEl = $$('resources');
      var bibItems = doc.getIndex('type').get('bib-item');
      each(bibItems, function(bibItem) {
        var bibItemEl = this.convertNode(bibItem);
        resourceEl.append(bibItemEl);
      }.bind(this));
      articleEl.append(resourceEl);

      // Export article body
      var bodyElements = this.convertContainer(doc.get('main'));
      articleEl.append(
        $$('body').append(bodyElements)
      );
      return articleEl.outerHTML;
    };
  };

  XMLExporter.extend(LensArticleExporter);
  ```
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
