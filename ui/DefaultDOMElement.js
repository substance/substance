'use strict';

var oo = require('./oo');
var $ = require('./jquery');
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

  this.html = function(html) {
    if (arguments.length === 0) {
      return this.getInnerHtml();
    } else {
      return this.setInnerHtml(html);
    }
  };

  this.text = function(text) {
    if (arguments.length === 0) {
      return this.getTextContent();
    } else {
      return this.setTextContent(text);
    }
  };

  this.addClass = function(classString) {
    this.$el.addClass(classString);
    return this;
  };

  this.hasClass = function(className) {
    return this.$el.hasClass(className);
  };


  this.clone = function() {
    var $clone = this.$el.clone();
    return new DefaultDOMElement($clone[0]);
  };

  this.attr = function(name, value) {
    if (arguments.length === 1) {
      return this.getAttribute(name);
    } else {
      return this.setAttribute(name, value);
    }
  };

  this.getTagName = function() {
    if (!this.el.tagName) {
      return "";
    } else {
      return this.el.tagName.toLowerCase();
    }
  };

  this.getChildNodeIterator = function() {
    return new DefaultDOMElement.NodeIterator(this.el.childNodes);
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
    // TODO: this is a bit awkward, maybe there is a smarter way to do it?
    debugger;
    if (inBrowser) {
      return this.el.outerHTML;
    } else {
      return DefaultDOMElement.create('div').append(this.clone()).html();
    }
  };

  this.getAttribute = function(name) {
    return this.$el.attr(name);
  };

  this.setAttribute = function(name, value) {
    this.$el.attr(name, value);
    return this;
  };

  this.setAttributes = function(attributes) {
    this.$el.attr(attributes);
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

DefaultDOMElement.parseHtml = function(html) {
  if (inBrowser) {
    var parser = new window.DOMParser();
    var htmlDoc = parser.parseFromString(html, 'text/html');
    if (htmlDoc) {
      var root = htmlDoc.querySelector('body');
      return new DefaultDOMElement(root).childNodes;
    }
  }
  return map($(html), function(el) {
    return new DefaultDOMElement(el);
  });
};

module.exports = DefaultDOMElement;
