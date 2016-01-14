'use strict';

var oo = require('../util/oo');
var $ = require('../util/jquery');
var isString = require('lodash/lang/isString');
var isArray = require('lodash/lang/isArray');
var extend = require('lodash/object/extend');
var each = require('lodash/collection/each');
var map = require('lodash/collection/map');
var inBrowser = (typeof window !== 'undefined');
var DOMElement = require('./DOMElement');

function DefaultDOMElement(el) {
  if (!el) {
    throw new Error('Illegal argument: el is null');
  }
  this.el = el;
  this.$el = $(el);
  this._handlers = {};
  Object.freeze(this);
}

DefaultDOMElement.Prototype = function() {

  this.hasClass = function(className) {
    if (inBrowser) {
      return this.el.classList.contains(className);
    } else {
      return this.$el.hasClass(className);
    }
  };

  this.addClass = function(classString) {
    if (inBrowser) {
      var classList = this.el.classList;
      var classes = classString.split(/\s+/);
      if (classes.length === 1) {
        classList.add(classString);
      } else {
        classes.forEach(function(c) {
          if (c) classList.add(c);
        });
      }
    } else {
      this.$el.addClass(classString);
    }
    return this;
  };

  this.removeClass = function(classString) {
    if (inBrowser) {
      var classList = this.el.classList;
      var classes = classString.split(/\s+/);
      if (classes.length === 1) {
        classList.remove(classString);
      } else {
        classes.forEach(function(c) {
          if (c) {
            classList.remove(c);
          }
        });
      }
    } else {
      this.$el.removeClass(classString);
    }
    return this;
  };

  this.attr = function(name, value) {
    if (arguments.length === 1) {
      if (isString(arguments[0])) {
        return this.getAttribute(name);
      } else {
        each(arguments[0], function(val, name) {
          this.setAttribute(name, val);
        }.bind(this));
        return this;
      }
    } else {
      this.setAttribute(name, value);
      return this;
    }
  };

  this.removeAttr = function(name) {
    if (inBrowser) {
      this.el.removeAttribute(name);
    } else {
      delete this.el.attribs[name];
    }
    return this;
  };

  this.removeAttribute = this.removeAttr;

  this.getAttribute = function(name) {
    if (inBrowser) {
      if (this.el.hasAttribute(name)) {
        return this.el.getAttribute(name);
      } else {
        return undefined;
      }
    } else {
      return this.el.attribs[name];
    }
  };

  this.setAttribute = function(name, value) {
    if (inBrowser) {
      this.el.setAttribute(name, value);
    } else {
      this.el.attribs[name] = value;
    }
    return this;
  };

  this.getTagName = function() {
    if (inBrowser) {
      if (!this.el.tagName) {
        return "";
      } else {
        return this.el.tagName.toLowerCase();
      }
    } else {
      if (this.el.type !== 'tag') {
        return "";
      } else {
        return this.el.name.toLowerCase();
      }
    }
  };

  this.setTagName = function() {
    throw new Error('tagName is readonly.');
  };

  /**
    A convenience method to create an element with a different
    tagName but same content.
    @param {String} tagName
    @returns {DOMElement} a new element
  */
  this.withTagName = function(tagName) {
    if (inBrowser) {
      var wrapper = this._createNativeElement('div');
      var oldTagName = this.getTagName();
      var outerHTML = this.el.outerHTML;
      outerHTML = outerHTML.replace(new RegExp("^\s*<\s*"+oldTagName), '<'+tagName);
      outerHTML = outerHTML.replace(new RegExp(oldTagName + '\s*>\s*$'), tagName+'>');
      wrapper.innerHTML = outerHTML;
      return new DefaultDOMElement(wrapper.firstChild);
    } else {
      var newEl = this.createElement(tagName);
      newEl.innerHTML = this.innerHTML;
      newEl.el.attribs = extend({}, this.el.attribs);
      return newEl;
    }
  };

  this.getId = function() {
    return this.el.id;
  };

  this.setId = function(id) {
    this.el.id = id;
    return this;
  };

  this.getTextContent = function() {
    if (inBrowser) {
      return this.el.textContent;
    } else {
      return this.$el.text();
    }
  };

  this.setTextContent = function(text) {
    if (inBrowser) {
      this.el.textContent = text;
    } else {
      this.$el.text(text);
    }
    return this;
  };

  this.getInnerHtml = function() {
    if (inBrowser) {
      return this.el.innerHTML;
    } else {
      return this.$el.html();
    }
  };

  this.setInnerHtml = function(html) {
    if (inBrowser) {
      this.el.innerHTML = html;
    } else {
      this.$el.html(html);
    }
  };

  this.getOuterHtml = function() {
    if (inBrowser) {
      return this.el.outerHTML;
    } else {
      return $._serialize(this.el);
    }
  };

  this.getValue = function() {
    return this.$el.val();
  };

  this.setValue = function(value) {
    this.$el.val(value);
    return this;
  };

  this.getStyle = function(name) {
    if (inBrowser) {
      return this.el.style[name];
    } else {
      return this.$el.css(name);
    }
  };

  this.setStyle = function(name, value) {
    if (inBrowser) {
      this.el.style[name] = value;
    } else {
      this.$el.css(name, value);
    }
    return this;
  };

  this.addEventListener = function(eventName, selector, handler, context) {
    if (this._handlers[eventName]) {
      throw new Error('Handler for event "' + eventName + '" has already been registered.');
    }
    if (inBrowser) {
      if (context) {
        handler = handler.bind(context);
      }
      if (selector) {
        var _handler = handler;
        handler = function(event) {
          if ($(event.target).is(selector)) {
            _handler(event);
          }
        };
      }
      this.addEventListener(eventName, selector, handler);
      this._handlers[eventName] = handler;
    } else {
      // not supported in cheerio
    }
  };

  this.removeEventListener = function(eventName) {
    var handler = this._handlers[eventName];
    if (!handler) return;
    delete this._handlers[eventName];
    if (inBrowser) {
      this.el.removeEventListener(eventName, handler);
    } else {
      // not supported in cheerio
    }
  };

  this.focus = function() {
    if (inBrowser) {
      this.$el.focus();
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

  this.isDocumentNode = function() {
    if (inBrowser) {
      return (this.el.nodeType === window.Node.DOCUMENT_NODE);
    } else {
      return this.el === this.el.root;
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

  this._createNativeElement = function(tagName) {
    var el;
    if (inBrowser) {
      el = this.el.ownerDocument.createElement(tagName);
    } else {
      el = $._createElement(tagName, this.el.root);
    }
    return el;
  };

  this.createElement = function(tagName) {
    var el = this._createNativeElement(tagName);
    return new DefaultDOMElement(el);
  };

  this.clone = function() {
    var clone;
    if (inBrowser) {
      clone = this.el.cloneNode(true);
    } else {
      clone = this.$el.clone()[0];
    }
    return new DefaultDOMElement(clone);
  };

  this.is = function(cssSelector) {
    // Note: there is DOMElement.matches which is not supported
    // by all (mobile) browsers
    return this.$el.is(cssSelector);
  };

  this.getParent = function() {
    var parent;
    if (inBrowser) {
      parent = this.el.parentNode;
    } else {
      parent = this.el.parent;
    }
    if (parent) {
      return new DefaultDOMElement(parent);
    } else {
      return null;
    }
  };

  this.getRoot = function() {
    var el = this.el;
    var parent = el;
    while (parent) {
      el = parent;
      if (inBrowser) {
        parent = el.parentNode;
      } else {
        parent = el.parent;
      }
    }
    return new DefaultDOMElement(el);
  };

  this.find = function(cssSelector) {
    var result = null;
    if (inBrowser && this.el.querySelector) {
      result = this.el.querySelector(cssSelector);
    } else {
      result = this.$el.find(cssSelector)[0];
    }
    if (result) {
      return new DefaultDOMElement(result);
    } else {
      return null;
    }
  };

  this.findAll = function(cssSelector) {
    var result;
    if (inBrowser && this.el.querySelectorAll) {
      result = this.el.querySelectorAll(cssSelector);
    } else {
      result = this.$el.find(cssSelector);
    }
    return map(result, function(el) {
      return new DefaultDOMElement(el);
    });
  };

  this.append = function(child) {
    if (isArray(child)) {
      child.forEach(function(node) {
        this.append(node);
      }.bind(this));
    } else if (child instanceof DefaultDOMElement) {
      this.$el.append(child.el);
    } else {
      this.$el.append(child);
    }
    return this;
  };

  this.insertAt = function(pos, child) {
    var children = this.children;
    if (pos > children.length-1) {
      this.append(child);
    } else {
      this.$el.insertBefore(children[pos].$el);
    }
    return this;
  };

  this.removeAt = function(pos) {
    this.children[pos].$el.remove();
    return this;
  };

  this.empty = function() {
    if (inBrowser) {
      this.el.innerHTML = "";
    } else {
      this.$el.empty();
    }
    return this;
  };

  this.remove = function() {
    this.$el.remove();
  };

};

DOMElement.extend(DefaultDOMElement);

Object.defineProperties(DefaultDOMElement.prototype, {
  /**
    @property {String} ui/DOMElement#tagName
   */
  'tagName': {
    configurable: true,
    get: function() {
      return this.getTagName();
    },
    set: function(tagName) {
      this.setTagName(tagName);
    }
  },
  /**
    @property {Array<ui/DOMElement>} ui/DOMElement#children children elements
   */
  'children': {
    configurable: true,
    get: function() {
      return this.getChildren();
    },
    set: function() {
      throw new Error('ui/DOMElement#children is readonly.');
    }
  },
});

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

function _parseMarkup(str, format) {
  var nativeEls = [];
  var doc;

  if (!str) {
    // Create an empty XML document
    if (inBrowser) {
      if (format === 'xml') {
        doc = (new window.DOMParser()).parseFromString('<dummy/>', 'text/xml');
        // doc.removeChild(doc.documentElement);
        // doc.ownerDocument = doc;
      } else {
        doc = (new window.DOMParser()).parseFromString('<html></html>', 'text/html');
      }
    }
    // cheerio
    else {
      if (format === 'xml') {
        doc = $.parseXML('');
      } else {
        doc = $.parseHTML('');
      }
    }
    return new DefaultDOMElement(doc);
  } else if (inBrowser) {
    var parser = new window.DOMParser();
    var isFullDoc;
    if (format === 'html') {
      isFullDoc = (str.search('<html>')>=0);
      doc = parser.parseFromString(str, 'text/html');
    } else if (format === 'xml') {
      doc = parser.parseFromString(str, 'text/xml');
    }
    if (doc) {
      if (format === 'html') {
        if (isFullDoc) {
          nativeEls = [doc.querySelector('html')];
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
    } else {
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
    }
  }
  // cheerio
  else {
    nativeEls = $.parseXML(str);
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
  return _parseMarkup(html, 'html');
};

/*
  @param {String} xml
  @returns {DOMElement|DOMElement[]}
*/
DefaultDOMElement.parseXML = function(xml) {
  return _parseMarkup(xml, 'xml');
};

module.exports = DefaultDOMElement;
