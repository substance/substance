'use strict';

var oo = require('./oo');
var $ = require('./jquery');
var map = require('lodash/collection/map');
var inBrowser = (typeof window !== 'undefined');

function DOMElement(el) {
  if (!el) {
    throw new Error('Illegal argument: el is null');
  }
  this.el = el;
  this.$el = $(el);
  Object.freeze(this);
}

DOMElement.Prototype = function() {

  /**
    Checks if a given CSS selector matches for this element.

    @param {String} cssSelector
    @returns {Boolean}
   */
  this.is = function(cssSelector) {
    return this.$el.is(cssSelector);
  };

  /**
    Find the first descendant element matching the given CSS selector.
    Note this differs from jQuery.find() that it returns only one element.

    @param {String} cssSelector
    @returns {util/DOMElement} found element
   */
  this.find = function(cssSelector) {
    var $result = this.$el.find(cssSelector);
    if ($result.length > 0) {
      return new DOMElement($result[0]);
    } else {
      return null;
    }
  };

  /**
    Find all descendant elements matching the given CSS selector.

    @param {String} cssSelector
    @returns {Array<util/DOMElement>} found elements
   */
  this.findAll = function(cssSelector) {
    var $result = this.$el.find(cssSelector);
    return map($result, function(el) {
      return new DOMElement(el);
    });
  };

  /**
    Append a child element.

    @param {util/DOMElement|String} child An element or text to append
    @returns this
   */
  this.append = function(child) {
    if (child instanceof DOMElement) {
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
    return new DOMElement($clone[0]);
  };

  /**
    jQuery style getter and setter for attributes.

    @param {String} name
    @param {value} [value] if present the attribute will be set
    @returns {String|this} if used as getter the attribute value, otherwise this element for chaining
   */
  this.attr = function(name, value) {
    if (arguments.length === 1) {
      return this.getAttribute(name);
    } else {
      return this.setAttribute(name, value);
    }
  };

  /**
    Get the tagName of this element

    @returns {String} the tag name in lower-case.
   */
  this.getTagName = function() {
    if (!this.el.tagName) {
      return "";
    } else {
      return this.el.tagName.toLowerCase();
    }
  };

  this.getChildNodeIterator = function() {
    return new DOMElement.NodeIterator(this.el.childNodes);
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
      return new DOMElement(child);
    });
  };

  /**
    Checks if the element is a TextNode.

    @returns {Boolean} true if the element is of type `Node.TEXT_NODE`
   */
  this.isTextNode = function() {
    if (inBrowser) {
      return (this.el.nodeType === window.Node.TEXT_NODE);
    } else {
      // cheerio text node
      return this.el.type === "text";
    }
  };

  /**
    Checks if the element is actually an element as opposed to a node.

    @returns {Boolean} true if the element is of type `Node.ELEMENT_NODE`
   */
  this.isElementNode = function() {
    if (inBrowser) {
      return (this.el.nodeType === window.Node.ELEMENT_NODE);
    } else {
      return this.el.type === "tag";
    }
  };

  /**
    Checks if the element is a CommentNode.

    @returns {Boolean} true if the element is of type `Node.COMMENT_NODE`
   */
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
    return DOMElement.create('div').append(this.clone()).html();
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

oo.initClass(DOMElement);

/**
 */
DOMElement.create = function(str) {
  str = str.trim();
  if (str[0] !== '<') {
    str = '<' + str + '>';
  }
  var el;
  el = $(str)[0];
  return new DOMElement(el);
};

Object.defineProperties(DOMElement.prototype, {
  /**
    @property {String} util/DOMElement#tagName
   */
  'tagName': {
    get: function() {
      return this.getTagName();
    },
    set: function() {
      throw new Error('util/DOMElement#tagName is readonly.');
    }
  },
  /**
    @property {String} util/DOMElement#textContent
   */
  'textContent': {
    get: function() {
      return this.getTextContent();
    },
    set: function(text) {
      this.setTextContent(text);
    }
  },
  /**
    @property {String} util/DOMElement#innerHtml
   */
  'innerHtml': {
    get: function() {
      return this.getInnerHtml();
    },
    set: function(html) {
      this.setInnerHtml(html);
    }
  },
  /**
    @property {String} util/DOMElement#outerHtml
   */
  'outerHtml': {
    get: function() {
      return this.getOuterHtml();
    },
    set: function() {
      throw new Error('util/DOMElement#outerHtml is readonly.');
    }
  },
  /**
    @property {String} util/DOMElement#nodeType
   */
  'nodeType': {
    get: function() {
      return this.getNodeType();
    },
    set: function() {
      throw new Error('util/DOMElement#nodeType is readonly.');
    }
  },
  /**
    @property {Array<util/DOMElement>} util/DOMElement#children children elements
   */
  'children': {
    get: function() {
      return this.getChildren();
    },
    set: function() {
      throw new Error('util/DOMElement#children is readonly.');
    }
  },
  /**
    @property {Array<util/DOMElement>} util/DOMElement#children child nodes
   */
  'childNodes': {
    get: function() {
      return this.getChildNodes();
    },
    set: function() {
      throw new Error('util/DOMElement#childNodes is readonly.');
    }
  },
});

/**
  A class that provides a browser/server compatible way to iterate
  over all children of an HTML element.

  @class
  @param {util/DOMElement} el
 */
DOMElement.NodeIterator = function(nodes) {
  this.nodes = nodes;
  this.length = this.nodes.length;
  this.pos = -1;
};

DOMElement.NodeIterator.Prototype = function() {

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
    if (next instanceof DOMElement) {
      return next;
    }
    return new DOMElement(next);
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

oo.initClass(DOMElement.NodeIterator);

DOMElement.parseHtml = function(html) {
  if (inBrowser) {
    var parser = new window.DOMParser();
    var htmlDoc = parser.parseFromString(html, 'text/html');
    if (htmlDoc) {
      var root = htmlDoc.querySelector('body');
      return new DOMElement(root).childNodes;
    }
  }
  return map($(html), function(el) {
    return new DOMElement(el);
  });
};

module.exports = DOMElement;
