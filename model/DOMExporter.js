"use strict";

var oo = require('../util/oo');
var each = require('lodash/collection/each');
var Annotator = require('./Annotator');
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

  this.initialize();
}

DOMExporter.Prototype = function() {

  this.initialize = function() {
    var containerId = this.config.containerId;
    if (!containerId) {
      throw new Error('Container id must be specified: provide config.containerId');
    }
    this.state.containerId = containerId;
  };

  this.exportDocument = function(doc) {
    this.state.doc = doc;
    var elements = this.convertContainer(doc, this.state.containerId);
    var out = elements.map(function(el) {
      return el.outerHTML;
    });
    return out.join('');
  };

  this._initState = function() {
    // get the target containerId from config or schema
  };

  this.convertContainer = function(doc, containerId) {
    var elements = [];
    var container = doc.get(containerId);
    if (!container) {
      throw new Error('Could not find container with id ' + containerId);
    }
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
    var converter = this._getNodeConverter(node);
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
      el = this.defaultBlockNodeExporter(node, el, this) || el;
    }
    return el;
  };

  this.convertProperty = function(doc, path, options) {
    this.initialize(doc, options);
    var wrapper = $$('div')
      .append(this.annotatedText(path));
    return wrapper.innerHTML;
  };


  // default HTML serialization
  this.defaultBlockNodeExporter = function(node, el, converter) {
    el.attr('data-type', node.type);
    var properties = node.toJSON();
    each(properties, function(value, name) {
      if (name === 'id' || name === 'type') {
        return;
      }
      var prop = $$('div').attr('property', name);
      if (node.getPropertyType() === 'string') {
        prop.append(converter.annotatedText([node.id, name]));
      } else {
        prop.text(value);
      }
      el.append(prop);
    });
  };

  this.annotatedText = function(path) {
    var self = this;
    var doc = this.state.doc;
    var annotations = doc.getIndex('annotations').get(path);
    var text = doc.get(path);

    var annotator = new Annotator();
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
      var converter = self._getNodeConverter(anno);
      var el;
      if (converter.tagName) {
        el = $$(converter.tagName);
      } else {
        el = $$('span');
      }
      el.attr('data-id', anno.id);
      el.append(context.children);
      //
      if (converter.export) {
        converter.export(anno, el, self);
      }
      parentContext.children.push(el);
    };
    var wrapper = { children: [] };
    annotator.start(wrapper, text, annotations);
    return wrapper.children;
  };

  this._getNodeConverter = function(node) {
    return this.converters.get(node.type);
  };

  // this.createHtmlDocument = function() {
  //   var EMPTY_DOC = '<!DOCTYPE html><html><head></head><body></body></html>';
  //   if (inBrowser) {
  //     var parser = new window.DOMParser();
  //     var doc = parser.parseFromString(EMPTY_DOC, "text/html");
  //     return $(doc);
  //   } else {
  //     // creating document using cheerio
  //     var $root = $.load(EMPTY_DOC).root();
  //     return $root;
  //   }
  // };

  this.getDocument = function() {
    return this.state.doc;
  };

  // this.createXmlDocument = function() {
  //   // We provide xmlns="http://www.w3.org/1999/xhtml" so we don't get the whole doc
  //   // polluted with xmlns attributes
  //   // See: http://stackoverflow.com/questions/8084175/how-do-i-prevent-jquery-from-inserting-the-xmlns-attribute-in-an-xml-object
  //   var EMPTY_DOC = '<article xmlns="http://www.w3.org/1999/xhtml"></article>';
  //   if (inBrowser) {
  //     var parser = new window.DOMParser();
  //     var doc = parser.parseFromString(EMPTY_DOC, "text/xml");
  //     return $(doc);
  //   } else {
  //     // creating document using cheerio
  //     var $root = $.load(EMPTY_DOC).root();
  //     return $root;
  //   }
  // };

};

oo.initClass(DOMExporter);

module.exports = DOMExporter;
