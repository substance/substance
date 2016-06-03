"use strict";

var extend = require('lodash/extend');
var isString = require('lodash/isString');
var error = require('../util/error');
var oo = require('../util/oo');
var Registry = require('../util/Registry');
var Fragmenter = require('./Fragmenter');
var encodeXMLEntities = require('../util/encodeXMLEntities');

function DOMExporter(config) {
  if (!config.converters) {
    throw new Error('config.converters is mandatory');
  }
  this.converters = new Registry();
  this.state = {
    doc: null
  };
  this.config = extend({idAttribute: 'id'}, config);

  config.converters.forEach(function(converter) {
    if (!converter.type) {
      error('Converter must provide the type of the associated node.', converter);
      return;
    }
    this.converters.add(converter.type, converter);
  }.bind(this));

  // NOTE: Subclasses (HTMLExporter and XMLExporter) must initialize this
  // with a proper DOMElement instance which is used to create new elements.
  this._el = null;
  this.$$ = this.createElement.bind(this);
}

DOMExporter.Prototype = function() {

  this.exportDocument = function(doc) {
    // TODO: this is no left without much functionality
    // still, it would be good to have a consistent top-level API
    // i.e. converter.importDocument(el) and converter.exportDocument(doc)
    // On the other side, the 'internal' API methods are named this.convert*.
    return this.convertDocument(doc);
  };

  /**
    @param {Document}
    @returns {DOMElement|DOMElement[]} The exported document as DOM or an array of elements
             if exported as partial, which depends on the actual implementation
             of `this.convertDocument()`.

    @abstract
    @example

    this.convertDocument = function(doc) {
      var elements = this.convertContainer(doc, this.state.containerId);
      var out = elements.map(function(el) {
        return el.outerHTML;
      });
      return out.join('');
    };
  */
  this.convertDocument = function(doc) { // eslint-disable-line
    throw new Error('This method is abstract');
  };

  this.convertContainer = function(container) {
    if (!container) {
      throw new Error('Illegal arguments: container is mandatory.');
    }
    var doc = container.getDocument();
    this.state.doc = doc;
    var elements = [];
    container.nodes.forEach(function(id) {
      var node = doc.get(id);
      var nodeEl = this.convertNode(node);
      elements.push(nodeEl);
    }.bind(this));
    return elements;
  };

  this.convertNode = function(node) {
    if (isString(node)) {
      // Assuming this.state.doc has been set by convertDocument
      node = this.state.doc.get(node);
    } else {
      this.state.doc = node.getDocument();
    }

    var converter = this.getNodeConverter(node);
    if (!converter) {
      converter = this.getDefaultBlockConverter();
    }
    var el;
    if (converter.tagName) {
      el = this.$$(converter.tagName);
    } else {
      el = this.$$('div');
    }
    el.attr(this.config.idAttribute, node.id);
    if (converter.export) {
      el = converter.export(node, el, this) || el;
    } else {
      el = this.getDefaultBlockConverter().export(node, el, this) || el;
    }
    return el;
  };

  this.convertProperty = function(doc, path, options) {
    this.initialize(doc, options);
    var wrapper = this.$$('div')
      .append(this.annotatedText(path));
    return wrapper.innerHTML;
  };

  this.annotatedText = function(path) {
    var self = this;
    var doc = this.state.doc;
    var annotations = doc.getIndex('annotations').get(path);
    var text = doc.get(path);

    var annotator = new Fragmenter();
    annotator.onText = function(context, text) {
      context.children.push(encodeXMLEntities(text));
    };
    annotator.onEnter = function(fragment) {
      var anno = fragment.node;
      return {
        annotation: anno,
        children: []
      };
    };
    annotator.onExit = function(fragment, context, parentContext) {
      var anno = context.annotation;
      var converter = self.getNodeConverter(anno);
      if (!converter) {
        converter = self.getDefaultPropertyAnnotationConverter();
      }
      var el;
      if (converter.tagName) {
        el = this.$$(converter.tagName);
      } else {
        el = this.$$('span');
      }
      el.attr(this.config.idAttribute, anno.id);
      el.append(context.children);
      if (converter.export) {
        converter.export(anno, el, self);
      }
      parentContext.children.push(el);
    }.bind(this);
    var wrapper = { children: [] };
    annotator.start(wrapper, text, annotations);
    return wrapper.children;
  };

  this.getNodeConverter = function(node) {
    return this.converters.get(node.type);
  };

  this.getDefaultBlockConverter = function() {
    throw new Error('This method is abstract.');
  };

  this.getDefaultPropertyAnnotationConverter = function() {
    throw new Error('This method is abstract.');
  };

  this.getDocument = function() {
    return this.state.doc;
  };

  this.createElement = function(str) {
    return this._el.createElement(str);
  };

};

oo.initClass(DOMExporter);

module.exports = DOMExporter;
