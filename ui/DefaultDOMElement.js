'use strict';

var oo = require('../util/oo');
var $ = require('../util/jquery');
var map = require('lodash/collection/map');
var inBrowser = (typeof window !== 'undefined');
var DOMElement = require('./DOMElement');

function DefaultDOMElement(el) {
  if (!el) {
    throw new Error('Illegal argument: el is null');
  }
  this.el = el;
  this.$el = $(el);
  Object.freeze(this);
}

DefaultDOMElement.Prototype = function() {

  this.hasClass = function(className) {
    return this.$el.hasClass(className);
  };

  this.addClass = function(classString) {
    this.$el.addClass(classString);
    return this;
  };

  this.removeClass = function(classString) {
    this.$el.removeClass(classString);
    return this;
  };

  this.attr = function(name, value) {
    if (arguments.length === 1) {
      return this.getAttribute(name);
    } else {
      return this.setAttribute(name, value);
    }
  };

  this.removeAttr = function(name) {
    this.$el.removeAttr(name);
    return this;
  };

  this.getAttribute = function(name) {
    return this.$el.attr(name);
  };

  this.setAttribute = function(name, value) {
    this.$el.attr(name, value);
    return this;
  };

  this.getTagName = function() {
    if (!this.el.tagName) {
      return "";
    } else {
      return this.el.tagName.toLowerCase();
    }
  };

  this.setTagName = function() {
    throw new Error('tagName is readonly.');
  };

  this.getTextContent = function() {
    return this.$el.text();
  };

  this.setTextContent = function(text) {
    this.$el.text(text);
  };

  this.getInnerHtml = function() {
    return this.$el.html();
  };

  this.setInnerHtml = function(html) {
    this.$el.html(html);
  };

  this.getOuterHtml = function() {
    if (inBrowser) {
      return this.el.outerHTML;
    } else {
      // TODO: this seems a bit awkward, but with jQuery there is no better
      // way... maybe using low-level cheerio API?
      return DefaultDOMElement.createElement('div').append(this.clone()).html();
    }
  };

  this.getValue = function() {
    return this.$el.val();
  };

  this.setValue = function(value) {
    this.$el.val(value);
    return this;
  };

  this.getNodeType = function() {
    if (this.isTextNode()) {
      return "text";
    } else if (this.isCommentNode()) {
      return "comment";
    } else if (this.isElementNode()) {
      return "element";
    } else {
      throw new Error("Unsupported node type");
    }
  };

  this.isTextNode = function() {
    if (inBrowser) {
      return (this.el.nodeType === window.Node.TEXT_NODE);
    } else {
      // cheerio text node
      return this.el.type === "text";
    }
  };

  this.isElementNode = function() {
    if (inBrowser) {
      return (this.el.nodeType === window.Node.ELEMENT_NODE);
    } else {
      return this.el.type === "tag";
    }
  };

  this.isCommentNode = function() {
    if (inBrowser) {
      return (this.el.nodeType === window.Node.COMMENT_NODE);
    } else {
      return this.el.type === "comment";
    }
  };

  this.getChildNodes = function() {
    var childNodes = [];
    var iterator = this.getChildNodeIterator();
    while (iterator.hasNext()) {
      childNodes.push(iterator.next());
    }
    return childNodes;
  };

  this.getChildren = function() {
    var children = this.$el.children();
    return map(children, function(child) {
      return new DefaultDOMElement(child);
    });
  };

  this.getChildNodeIterator = function() {
    return new DefaultDOMElement.NodeIterator(this.el.childNodes);
  };

  this.clone = function() {
    var $clone = this.$el.clone();
    return new DefaultDOMElement($clone[0]);
  };

  this.is = function(cssSelector) {
    return this.$el.is(cssSelector);
  };

  this.find = function(cssSelector) {
    var $result = this.$el.find(cssSelector);
    if ($result.length > 0) {
      return new DefaultDOMElement($result[0]);
    } else {
      return null;
    }
  };

  this.findAll = function(cssSelector) {
    var $result = this.$el.find(cssSelector);
    return map($result, function(el) {
      return new DefaultDOMElement(el);
    });
  };

  this.append = function(child) {
    if (child instanceof DefaultDOMElement) {
      this.$el.append(child.$el);
    } else {
      this.$el.append(child);
    }
    return this;
  };

  this.insertAt = function(pos, child) {
    /* jshint unused:false */
    throw new Error('This method is abstract.');
  };

  this.removeAt = function(pos) {
    /* jshint unused:false */
    throw new Error('This method is abstract.');
  };

  this.empty = function() {
    this.$el.empty();
    return this;
  };

};

DOMElement.extend(DefaultDOMElement);

DefaultDOMElement.createElement = function(str) {
  str = str.trim();
  if (str[0] !== '<') {
    str = '<' + str + '>';
  }
  var el;
  el = $(str)[0];
  return new DefaultDOMElement(el);
};

DefaultDOMElement.createTextNode = function(text) {
  var el;
  if (inBrowser) {
    el = window.document.createTextNode(text);
  } else {
    // HACK: using custom factory method for cheerio's native text node
    el = $._createTextNode(text);
  }
  return new DefaultDOMElement(el);
};

DefaultDOMElement.$$ = DefaultDOMElement.createElement;

/**
  A class that provides a browser/server compatible way to iterate
  over all children of an HTML element.

  @class
  @private
  @param {util/DefaultDOMElement} el
 */
DefaultDOMElement.NodeIterator = function(nodes) {
  this.nodes = nodes;
  this.length = this.nodes.length;
  this.pos = -1;
};

DefaultDOMElement.NodeIterator.Prototype = function() {

  /**
    @returns {Boolean} true if there is another child node left.
   */
  this.hasNext = function() {
    return this.pos < this.length - 1;
  };

  /**
    Increments the iterator providing the next child node.

    @returns {HTMLElement} The next child node.
   */
  this.next = function() {
    this.pos += 1;
    var next = this.nodes[this.pos];
    if (next instanceof DefaultDOMElement) {
      return next;
    }
    return new DefaultDOMElement(next);
  };

  /**
    Decrements the iterator.
   */
  this.back = function() {
    if (this.pos >= 0) {
      this.pos -= 1;
    }
    return this;
  };
};

oo.initClass(DefaultDOMElement.NodeIterator);

function _parseXML(str, format) {
  var nativeEls = [];

  if (inBrowser) {
    var parser = new window.DOMParser();
    var doc;
    var isFullDoc;
    if (format === 'html') {
      isFullDoc = (str.search('<html>')>=0);
      doc = parser.parseFromString(str, 'text/html');
    } else if (format === 'xml') {
      doc = parser.parseFromString(str, 'text/xml');
    }
    if (!doc) {
      // console.error('DOMParser.parseFromString failed. Falling back to jQuery based parsing.');
      if (format === "html") {
        if (isFullDoc) {
          doc = $.parseXML(str);
          nativeEls = doc.childNodes;
        } else {
          nativeEls = $.parseHTML(str);
        }
      } else if (format === "xml") {
        doc = $.parseXML(str);
        nativeEls = doc.childNodes;
      }
    } else {
      if (format === 'html') {
        if (isFullDoc) {
          nativeEls = [doc];
        } else {
          // if the provided html is just a partial
          // then DOMParser still creates a full document
          // thus we pick the body and provide its content
          var body = doc.querySelector('body');
          nativeEls = body.childNodes;
        }
      } else if (format === 'xml') {
        // Note: as XML parser we always get a document with childNodes representing
        // the content
        // TODO: is it ok just to provide the 'content', not the XML meta info?
        nativeEls = doc.childNodes;
      }
    }
  } else {
    nativeEls = $(str);
  }

  var elements = [];
  for (var i = 0; i < nativeEls.length; i++) {
    elements.push(new DefaultDOMElement(nativeEls[i]));
  }
  if (elements.length === 1) {
    return elements[0];
  } else {
    return elements;
  }
}

/*
  @param {String} html
  @returns {DOMElement|DOMElement[]}
*/
DefaultDOMElement.parseHTML = function(html) {
  return _parseXML(html, 'html');
};

/*
  @param {String} xml
  @returns {DOMElement|DOMElement[]}
*/
DefaultDOMElement.parseXML = function(xml) {
  return _parseXML(xml, 'xml');
};

module.exports = DefaultDOMElement;
