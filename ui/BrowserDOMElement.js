'use strict';

var isString = require('lodash/isString');
var isNumber = require('lodash/isNumber');
var DOMElement = require('./DOMElement');
var DelegatedEvent = require('./DelegatedEvent');

var elProto = window.Element.prototype;
var matches = (
  elProto.matches || elProto.matchesSelector ||
  elProto.msMatchesSelector || elProto.webkitMatchesSelector
);

function BrowserDOMElement(el) {
  console.assert(el instanceof window.Node || el === window, "Expecting native DOM node.");
  this.el = el;
  el._wrapper = this;
  this.eventListeners = [];
  this.htmlProps = {};
}

BrowserDOMElement.Prototype = function() {

  this._isBrowserDOMElement = true;

  this.getNativeElement = function() {
    return this.el;
  };

  this.hasClass = function(className) {
    return this.el.classList.contains(className);
  };

  this.addClass = function(className) {
    this.el.classList.add(className);
    return this;
  };

  this.removeClass = function(className) {
    this.el.classList.remove(className);
    return this;
  };

  this.getClasses = function() {
    return this.el.className;
  };

  this.setClasses = function(classString) {
    this.el.className = classString;
  };

  this.getAttribute = function(name) {
    return this.el.getAttribute(name);
  };

  this.setAttribute = function(name, value) {
    this.el.setAttribute(name, value);
  };

  this.removeAttribute = function(name) {
    return this.el.removeAttribute(name);
  };

  this.getAttributes = function() {
    var result = {};
    var attributes = this.el.attributes;
    var l = attributes.length;
    for(var i=0; i < l; i++) {
      var attr = attributes.item(i);
      if (attr.name === 'class' && attr.name === 'style') {
        result[attr.name] = attr.value;
      }
    }
    return result;
  };

  this.getProperty = function(name) {
    return this.el[name];
  };

  this.setProperty = function(name, value) {
    this.htmlProps[name] = value;
    this.el[name] = value;
  };

  this.removeProperty = function(name) {
    delete this.htmlProps[name];
    delete this.el[name];
  };

  this.getTagName = function() {
    if (this.el.tagName) {
      return this.el.tagName.toLowerCase();
    }
  };

  this.setTagName = function(tagName) {
    var newEl = BrowserDOMElement.createElement(tagName);
    var attributes = this.el.attributes;
    var l = attributes.length;
    var i;
    for(i = 0; i < l; i++) {
      var attr = attributes.item(i);
      newEl.setAttribute(attr.name, attr.value);
    }
    for (var key in this.htmlProps) {
      if (this.htmlProps.hasOwnProperty(key)) {
        newEl[key] = this.htmlProps[key];
      }
    }
    this.eventListeners.forEach(function(listener) {
      newEl.addEventListener(listener.eventName, listener.handler, listener.capture);
    });
    this._replaceNativeEl(newEl);
  };

  this.getId = function() {
    return this.el.id;
  };

  this.setId = function(id) {
    this.el.id = id;
  };

  this.getValue = function() {
    return this.el.value;
  };

  this.setValue = function(value) {
    this.el.value = value;
  };

  this.getStyle = function(name) {
    // NOTE: important to provide computed style, otherwise we don't get inherited styles
    var style = this.getComputedStyle();
    return style[name] || this.el.style[name];
  };

  this.getComputedStyle = function() {
    return window.getComputedStyle(this.el);
  };

  var _pxStyles = {
    top: true,
    bottom: true,
    left: true,
    right: true,
    height: true,
    width: true
  };

  this.setStyle = function(name, value) {
    if (_pxStyles[name] && isNumber(value)) {
      value = value + "px";
    }
    this.el.style[name] = value;
  };

  this.getTextContent = function() {
    return this.el.textContent;
  };

  this.setTextContent = function(text) {
    this.el.textContent = text;
  };

  this.getInnerHTML = function() {
    var innerHTML = this.el.innerHTML;
    if (!isString(innerHTML)) {
      var frag = this.el.ownerDocument.createDocumentFragment();
      for (var c = this.el.firstChild; c; c = c.nextSibling) {
        frag.appendChild(c.clone(true));
      }
      var xs = new window.XMLSerializer();
      innerHTML = xs.serializeToString(frag);
    }
    return innerHTML;
  };

  this.setInnerHTML = function(html) {
    this.el.innerHTML = html;
  };

  this.getOuterHTML = function() {
    return this.el.outerHTML;
  };

  this.addEventListener = function(eventName, handler, options) {
    var listener;
    if (arguments.length === 1 && arguments[0]) {
      listener = arguments[0];
    } else {
      listener = new DOMElement.EventListener(eventName, handler, options);
    }
    if (listener.options.selector && !listener.__hasEventDelegation__) {
      listener.handler = this._delegatedHandler(listener);
      listener.__hasEventDelegation__ = true;
    }
    this.el.addEventListener(listener.eventName, listener.handler, listener.capture);
    listener._el = this;
    this.eventListeners.push(listener);
  };

  this._delegatedHandler = function(listener) {
    var handler = listener.handler;
    var context = listener.context;
    var selector = listener.options.selector;
    var nativeTop = this.getNativeElement();
    return function(event) {
      var nativeEl = event.target;
      while(nativeEl) {
        if (matches.call(nativeEl, selector)) {
          handler(new DelegatedEvent(context, event.target, event));
          break;
        }
        if (nativeEl === nativeTop) {
          break;
        }
        nativeEl = nativeEl.parentNode;
      }
    };
  };

  this.removeEventListener = function(eventName, handler) {
    var listener = null, idx = -1;
    if (arguments.length === 1 && arguments[0]._isDOMEventListener) {
      listener = arguments[0];
    } else {
      idx = DOMElement._findEventListenerIndex(this.eventListeners, eventName, handler);
      listener = this.eventListeners[idx];
      if (idx > -1) {
        this.eventListeners.splice(idx, 1);
      }
    }
    if (listener) {
      listener._el = null;
      this.el.removeEventListener(listener.eventName, listener.handler);
    }
  };

  this.getEventListeners = function() {
    return this.eventListeners;
  };

  this.getChildCount = function() {
    return this.el.childNodes.length;
  };

  this.getChildNodes = function() {
    var childNodes = [];
    for (var node = this.el.firstChild; node; node = node.nextSibling) {
      childNodes.push(BrowserDOMElement.wrapNativeElement(node));
    }
    return childNodes;
  };

  this.getChildren = function() {
    var children = [];
    for (var node = this.el.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === window.Node.ELEMENT_NODE) {
        children.push(BrowserDOMElement.wrapNativeElement(node));
      }
    }
    return children;
  };

  this.getChildAt = function(pos) {
    return BrowserDOMElement.wrapNativeElement(this.el.childNodes[pos]);
  };

  this.isTextNode = function() {
    return (this.el.nodeType === window.Node.TEXT_NODE);
  };

  this.isElementNode = function() {
    return (this.el.nodeType === window.Node.ELEMENT_NODE);
  };

  this.isCommentNode = function() {
    return (this.el.nodeType === window.Node.COMMENT_NODE);
  };

  this.isDocumentNode = function() {
    return (this.el.nodeType === window.Node.DOCUMENT_NODE);
  };

  this.clone = function() {
    var clone = this.el.cloneNode(true);
    return BrowserDOMElement.wrapNativeElement(clone);
  };

  this.createElement = function(tagName) {
    var el = this.el.ownerDocument.createElement(tagName);
    return BrowserDOMElement.wrapNativeElement(el);
  };

  this.createTextNode = function(text) {
    var el = this.el.ownerDocument.createTextNode(text);
    return BrowserDOMElement.wrapNativeElement(el);
  };

  this.is = function(cssSelector) {
    // ATTENTION: looking at https://developer.mozilla.org/en/docs/Web/API/Element/matches
    // Element.matches might not be supported by some mobile browsers
    var el = this.el;
    return matches.call(el, cssSelector);
  };

  this.getParent = function() {
    var parent = this.el.parentNode;
    if (parent) {
      return BrowserDOMElement.wrapNativeElement(parent);
    } else {
      return null;
    }
  };

  this.getRoot = function() {
    var el = this.el;
    var parent = el;
    while (parent) {
      el = parent;
      parent = el.parentNode;
    }
    return BrowserDOMElement.wrapNativeElement(el);
  };

  this.find = function(cssSelector) {
    var result = null;
    if (this.el.querySelector) {
      result = this.el.querySelector(cssSelector);
    }
    if (result) {
      return BrowserDOMElement.wrapNativeElement(result);
    } else {
      return null;
    }
  };

  this.findAll = function(cssSelector) {
    var result = [];
    if (this.el.querySelectorAll) {
      result = this.el.querySelectorAll(cssSelector);
    }
    return Array.prototype.map.call(result, function(el) {
      return BrowserDOMElement.wrapNativeElement(el);
    });
  };

  this._normalizeChild = function(child) {
    if (child instanceof window.Node) {
      if (!child._wrapper) {
        child = BrowserDOMElement.wrapNativeElement(child);
      } else {
        return child;
      }
    }
    if (isString(child)) {
      child = this.createTextNode(child);
    }
    if (!child || !child._isBrowserDOMElement) {
      throw new Error('Illegal child type.');
    }
    console.assert(child.el._wrapper === child, "Expecting a backlink between native element and CheerioDOMElement");
    return child.getNativeElement();
  };

  this.appendChild = function(child) {
    var nativeChild = this._normalizeChild(child);
    this.el.appendChild(nativeChild);
    return this;
  };

  this.insertAt = function(pos, child) {
    var nativeChild = this._normalizeChild(child);
    var childNodes = this.el.childNodes;
    if (pos >= childNodes.length) {
      this.el.appendChild(nativeChild);
    } else {
      this.el.insertBefore(nativeChild, childNodes[pos]);
    }
  };

  this.insertBefore = function(child, before) {
    if (!before || !before._isBrowserDOMElement) {
      throw new Error('insertBefore(): Illegal arguments. "before" must be a BrowserDOMElement instance.');
    }
    var nativeChild = this._normalizeChild(child);
    this.el.insertBefore(nativeChild, before.el);
  };

  this.removeAt = function(pos) {
    this.el.removeChild(this.el.childNodes[pos]);
  };

  this.removeChild = function(child) {
    if (!child || !child._isBrowserDOMElement) {
      throw new Error('removeChild(): Illegal arguments. Expecting a BrowserDOMElement instance.');
    }
    this.el.removeChild(child.el);
  };

  this.replaceChild = function(oldChild, newChild) {
    if (!newChild || !oldChild ||
        !newChild._isBrowserDOMElement || !oldChild._isBrowserDOMElement) {
      throw new Error('replaceChild(): Illegal arguments. Expecting BrowserDOMElement instances.');
    }
    // Attention: Node.replaceChild has weird semantics
    this.el.replaceChild(newChild.el, oldChild.el);
  };

  this.empty = function() {
    // http://jsperf.com/empty-an-element/4 suggests that this is the fastest way to
    // clear an element
    var el = this.el;
    while (el.lastChild) {
      el.removeChild(el.lastChild);
    }
    return this;
  };

  this.remove = function() {
    if (this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  };

  this.serialize = function() {
    var outerHTML = this.el.outerHTML;
    if (isString(outerHTML)) {
      return outerHTML;
    } else {
      var xs = new window.XMLSerializer();
      return xs.serializeToString(this.el);
    }
  };

  this.isInDocument = function() {
    var el = this.el;
    while(el) {
      if (el.nodeType === window.Node.DOCUMENT_NODE) {
        return true;
      }
      el = el.parentNode;
    }
  };

  this._replaceNativeEl = function(newEl) {
    console.assert(newEl instanceof window.Node, "Expecting a native element.");
    var oldEl = this.el;
    var parentNode = oldEl.parentNode;
    if (parentNode) {
      parentNode.replaceChild(newEl, oldEl);
    }
    this.el = newEl;
  };

  this._getChildNodeCount = function() {
    return this.el.childNodes.length;
  };

  this.focus = function() {
    this.el.focus();
    return this;
  };

  this.blur = function() {
    this.el.focus();
    return this;
  };

  this.click = function() {
    this.el.click();
  };

  this.getWidth = function() {
    var rect = this.el.getClientRects()[0];
    if (rect) {
      return rect.width;
    } else {
      return 0;
    }
  };

  this.getHeight = function() {
    var rect = this.el.getClientRects()[0];
    if (rect) {
      return rect.height;
    } else {
      return 0;
    }
  };

  this.getOffset = function() {
    var rect = this.el.getBoundingClientRect();
    return {
      top: rect.top + document.body.scrollTop,
      left: rect.left + document.body.scrollLeft
    };
  };

  this.getPosition = function() {
    return {left: this.el.offsetLeft, top: this.el.offsetTop};
  };

  this.getOuterHeight = function(withMargin) {
    var outerHeight = this.el.offsetHeight;
    if (withMargin) {
      var style = this.getComputedStyle();
      outerHeight += parseInt(style.marginTop) + parseInt(style.marginBottom);
    }
    return outerHeight;
  };

};

DOMElement.extend(BrowserDOMElement);

DOMElement._defineProperties(BrowserDOMElement, DOMElement._propertyNames);

BrowserDOMElement.createTextNode = function(text) {
  return window.document.createTextNode(text);
};

BrowserDOMElement.createElement = function(tagName) {
  return window.document.createElement(tagName);
};

BrowserDOMElement.parseMarkup = function(str, format) {
  var nativeEls = [];
  var doc;
  if (!str) {
    // Create an empty XML document
    if (format === 'xml') {
      doc = (new window.DOMParser()).parseFromString('<dummy/>', 'text/xml');
      // doc.removeChild(doc.documentElement);
      // doc.ownerDocument = doc;
    } else {
      doc = (new window.DOMParser()).parseFromString('<html></html>', 'text/html');
    }
    return new BrowserDOMElement(doc);
  } else {
    var parser = new window.DOMParser();
    var isFullDoc;
    if (format === 'html') {
      isFullDoc = (str.search(/<\s*html/i)>=0);
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
      throw new Error('Could not parse DOM string.');
    }
  }
  var elements = Array.prototype.map.call(nativeEls, function(el) {
    return new BrowserDOMElement(el);
  });
  if (elements.length === 1) {
    return elements[0];
  } else {
    return elements;
  }
};

BrowserDOMElement.wrapNativeElement = function(el) {
  if (el._wrapper) {
    return el._wrapper;
  } else {
    return new BrowserDOMElement(el);
  }
};

module.exports = BrowserDOMElement;
