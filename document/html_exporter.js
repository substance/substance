"use strict";

var Substance = require('../basics');
var Annotator = require('./annotator');

var inBrowser = (typeof window !== 'undefined');
var $ = require('../basics/jquery');

function HtmlExporter(config) {
  this.config = config || {};
  this.state = null;
}

HtmlExporter.Prototype = function() {

  /**
   * @param doc Substance.Document instance
   * @param object options TODO: what options are available?
   * @return $element
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
    var $wrapper = $('<div>')
      .append(this.annotatedText(path));
    return $wrapper.html();
  };

  this.initialize = function(doc, options) {
    options = {} || options;
    this.state =  {
      doc: doc,
      options: options
    };
  };

  this.convertNode = function(node) {
    var NodeConverter = this.getNodeConverter(node);
    return NodeConverter.static.toHtml(node, this);
  };

  this.convertContainer = function(containerNode) {
    var state = this.state;
    var nodeIds = containerNode.nodes;
    var elements = [];
    for (var i = 0; i < nodeIds.length; i++) {
      var node = state.doc.get(nodeIds[i]);
      var $el = this.convertNode(node);
      if (!$el || !this.isElementNode($el[0])) {
        throw new Error('Contract: Node.static.toHtml() must return a DOM element. NodeType: '+node.type);
      }
      $el.attr('id', node.id);
      elements.push($el);
    }
    return elements;
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
      var NodeConverter = self.getNodeConverter(anno);
      var $el = NodeConverter.static.toHtml(anno, self, context.children);
      if (!$el || !self.isElementNode($el[0])) {
        throw new Error('Contract: Annotation.toHtml() must return a DOM element.');
      }
      $el.attr('id', anno.id);
      parentContext.children.push($el);
    };
    var wrapper = { children: [] };
    annotator.start(wrapper, text, annotations);
    return wrapper.children;
  };

  this.isElementNode = function(el) {
    if (inBrowser) {
      return (el.nodeType === window.Node.ELEMENT_NODE);
    } else {
      return el.type === "tag";
    }
  };

  this.createHtmlDocument = function() {
    var EMPTY_DOC = '<!DOCTYPE html><html><head></head><body></body></html>';
    if (inBrowser) {
      var parser = new window.DOMParser();
      var doc = parser.parseFromString(EMPTY_DOC, "text/html");
      return $(doc);
    } else {
      // creating document using cheerio
      var $root = $.load(EMPTY_DOC).root();
      return $root;
    }
  };

  this.createXmlDocument = function() {
    // We provide xmlns="http://www.w3.org/1999/xhtml" so we don't get the whole doc
    // polluted with xmlns attributes
    // See: http://stackoverflow.com/questions/8084175/how-do-i-prevent-jquery-from-inserting-the-xmlns-attribute-in-an-xml-object
    var EMPTY_DOC = '<article xmlns="http://www.w3.org/1999/xhtml"></article>';
    if (inBrowser) {
      var parser = new window.DOMParser();
      var doc = parser.parseFromString(EMPTY_DOC, "text/xml");
      return $(doc);
    } else {
      // creating document using cheerio
      var $root = $.load(EMPTY_DOC).root();
      return $root;
    }
  };
};

Substance.initClass(HtmlExporter);

module.exports = HtmlExporter;
