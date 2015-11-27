"use strict";

var oo = require('../util/oo');
var isBoolean = require('lodash/lang/isBoolean');
var isNumber = require('lodash/lang/isNumber');
var isString = require('lodash/lang/isString');
var each = require('lodash/collection/each');
var Fragmenter = require('./Fragmenter');
var Registry = require('../util/Registry');
var $$ = require('../ui/VirtualDOMElement').createElement;

function DOMExporter(config) {
  if (!config.converters) {
    throw new Error('config.converters is mandatory');
  }
  this.converters = new Registry();
  this.state = {
    doc: null
  };
  this.config = config;
  this.$$ = $$;
  config.converters.forEach(function(converter) {
    if (!converter.type) {
      console.error('Converter must provide the type of the associated node.', converter);
      return;
    }
    this.converters.add(converter.type, converter);
  }.bind(this));
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
  this.convertDocument = function(doc) {
    /* jshint unused:false */
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
    // always make sure that we have the doc in our state
    this.state.doc = node.getDocument();
    var converter = this.getNodeConverter(node);
    if (!converter) {
      converter = this.getDefaultBlockConverter();
    }
    var el;
    if (converter.tagName) {
      el = $$(converter.tagName);
    } else {
      el = $$('div');
    }
    el.attr('data-id', node.id);
    if (converter.export) {
      el = converter.export(node, el, this) || el;
    } else {
      el = this.getDefaultBlockConverter().export(node, el, this) || el;
    }
    return el;
  };

  this.convertProperty = function(doc, path, options) {
    this.initialize(doc, options);
    var wrapper = $$('div')
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
      context.children.push(text);
    };
    annotator.onEnter = function(entry) {
      var anno = entry.node;
      return {
        annotation: anno,
        children: []
      };
    };
    annotator.onExit = function(entry, context, parentContext) {
      var anno = context.annotation;
      var converter = self.getNodeConverter(anno);
      if (!converter) {
        converter = self.getDefaultPropertyAnnotationConverter();
      }
      var el;
      if (converter.tagName) {
        el = $$(converter.tagName);
      } else {
        el = $$('span');
      }
      el.attr('data-id', anno.id);
      el.append(context.children);
      if (converter.export) {
        converter.export(anno, el, self);
      }
      parentContext.children.push(el);
    };
    var wrapper = { children: [] };
    annotator.start(wrapper, text, annotations);
    return wrapper.children;
  };

  this.getNodeConverter = function(node) {
    return this.converters.get(node.type);
  };

  this.getDefaultBlockConverter = function() {
    return DOMExporter.defaultBlockConverter;
  };

  this.getDefaultPropertyAnnotationConverter = function() {
    return DOMExporter.defaultPropertyAnnotationConverter;
  };

  this.getDocument = function() {
    return this.state.doc;
  };

};

oo.initClass(DOMExporter);

DOMExporter.defaultBlockConverter = {
  export: function(node, el, converter) {
    el.attr('data-type', node.type);
    var properties = node.toJSON();
    each(properties, function(value, name) {
      if (name === 'id' || name === 'type') {
        return;
      }
      var prop = $$('div').attr('property', name);
      if (node.getPropertyType(name) === 'string') {
        prop.append(converter.annotatedText([node.id, name]));
      } else {
        prop.text(value);
      }
      el.append(prop);
    });
  }
};

DOMExporter.defaultPropertyAnnotationConverter = {
  export: function(node, el) {
    el.tagName = 'span';
    el.attr('data-type', node.type);
    var properties = node.toJSON();
    each(properties, function(value, name) {
      if (name === 'id' || name === 'type') {
        return;
      }
      if (isString(value) || isNumber(value) || isBoolean(value)) {
        el.attr('data-'+name, value);
      }
    });
  }
};


module.exports = DOMExporter;
