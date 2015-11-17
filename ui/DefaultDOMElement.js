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
    } else if (this.el.tagName) {
      return this.tagName;
    } else {
      throw new Error("Unknown node type");
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

oo.inherit(DefaultDOMElement, DOMElement);

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


// Contract:
// Always returns a document element that has a
// body element inside
// 
// Custom converter then picks information from there
DefaultDOMElement.parseHtml = function(html) {
  if (inBrowser) {
    var parser = new window.DOMParser();
    var htmlDoc = parser.parseFromString(html, 'text/html');
    if (htmlDoc) {
      return new DefaultDOMElement(htmlDoc);
    }
  }

  // This is not tested to work with Cheerio!  
  return new DefaultDOMElement($('<html><body>'+html+'</body></html>')[0]);
};

// Always returns a 
DefaultDOMElement.parseXML = function(xml) {
  if (inBrowser) {
    var parser = new window.DOMParser();
    var xmlDoc = parser.parseFromString(xml, 'text/xml');

    if (xmlDoc) {
      return new DefaultDOMElement(xmlDoc);
    }
  }

  // This is not tested to work with Cheerio!
  return new DefaultDOMElement($(xml)[0]);
};

module.exports = DefaultDOMElement;
