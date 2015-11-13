"use strict";

var oo = require('../util/oo');
var each = require('lodash/collection/each');
var Annotator = require('./Annotator');
var DOMElement = require('../util/DOMElement');
var $$ = require('../ui/Component').$$;

function HtmlExporter(config) {
  this.config = config || {};
  this.state = null;
}

HtmlExporter.Prototype = function() {

  /**
   * @param doc Substance.Document instance
   * @param object options TODO: what options are available?
   * @return {util/DOMElement} element
   */
  this.convert = function(doc, options) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
    /**
      Example:

      this.initialize(doc, options);
      var body = doc.get('body');
      this.convertContainer(body);
      return this.state.$root;
    */
  };

  this.getNodeConverter = function(node) {
    return node.constructor;
  };

  this.convertProperty = function(doc, path, options) {
    this.initialize(doc, options);
    var wrapper = DOMElement.create('div')
      .append(this.annotatedText(path));
    return wrapper.innerHtml;
  };

  this.initialize = function(doc, options) {
    options = {} || options;
    this.state =  {
      doc: doc,
      options: options
    };
  };

  this.convertNode = function(node) {
    var converter = this.getNodeConverter(node);
    var el;
    if (converter.tagName) {
      el = $$(converter.tagName);
    } else {
      el = $$('div');
    }
    el.attr('data-id', node.id);
    return converter.export(node, el, this);
  };

  this.convertContainer = function(containerNode) {
    var state = this.state;
    var nodeIds = containerNode.nodes;
    var elements = [];
    for (var i = 0; i < nodeIds.length; i++) {
      var node = state.doc.get(nodeIds[i]);
      var el = this.convertNode(node);
      elements.push(el);
    }
    return elements;
  };

  // default implementation for inline elements
  // Attention: there is a difference between the implementation
  // of toHtml for annotations and general nodes.
  // Annotations are modeled as overlays, so they do not 'own' their content.
  // Thus, during conversion HtmlExporter serves the content as a prepared
  // array of children element which just need to be wrapped (or can be manipulated).
  this.defaultInlineNodeExporter = function(anno, converter, children) {
    var id = anno.id;
    var tagName = anno.constructor.static.tagName || 'span';
    var el = DOMElement.create(tagName)
      .attr('id', id)
      .append(children);
    return el;
  };

  this.convertInlineNode = function(node, children) {
    return this.defaultInlineNodeExporter(node, this, children);
  };

  // default HTML serialization
  this.defaultBlockNodeExporter = function(node, converter) {
    var el = DOMElement.create('<div itemscope>')
      .attr('data-id', node.id)
      .attr('data-type', node.type);
    each(node.properties, function(value, name) {
      var prop = DOMElement.create('div').attr('itemprop', name);
      if (node.getPropertyType === 'string') {
        prop.append(converter.annotatedText([node.id, name]));
      } else {
        prop.text(value);
      }
      el.append(prop);
    });
    return el;
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
      var converter = self.getNodeConverter(anno);
      var el;
      if (converter.tagName) {
        el = $$(converter.tagName);
      } else {
        el = $$('span');
      }
      el.attr('data-id', anno.id);
      el.append(context.children);
      converter.export(anno, el, self);
      parentContext.children.push(el);
    };
    var wrapper = { children: [] };
    annotator.start(wrapper, text, annotations);
    return wrapper.children;
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

oo.initClass(HtmlExporter);

module.exports = HtmlExporter;
