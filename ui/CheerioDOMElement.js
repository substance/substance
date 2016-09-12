'use strict';

import isString from 'lodash/isString'
import last from 'lodash/last'
import extend from 'lodash/extend'
import clone from 'lodash/clone'
import map from 'lodash/map'
import $ from '../util/cheerio.customized'
import EventEmitter from '../util/EventEmitter'
import DOMElement from './DOMElement'

function CheerioDOMElement(el) {
  EventEmitter.call(this);

  this.el = el;
  this.$el = $(el);
  el._wrapper = this;
  this.htmlProps = {};
}

CheerioDOMElement.Prototype = function() {

  extend(this, EventEmitter.prototype);

  this._isCheerioDOMElement = true;

  this.getNativeElement = function() {
    return this.el;
  };

  this._wrapNativeElement = function(el) {
    if (el._wrapper) {
      return el._wrapper;
    } else {
      return new CheerioDOMElement(el);
    }
  };


  this.hasClass = function(className) {
    return this.$el.hasClass(className);
  };

  this.addClass = function(className) {
    this.$el.addClass(className);
    return this;
  };

  this.removeClass = function(className) {
    this.$el.removeClass(className);
    return this;
  };

  this.getClasses = function() {
    return this.$el.attr('class');
  };

  this.setClasses = function(classString) {
    this.$el.attr('class', classString);
    return this;
  };

  this.getAttribute = function(name) {
    return this.$el.attr(name);
  };

  this.setAttribute = function(name, value) {
    this.$el.attr(name, value);
    return this;
  };

  this.removeAttribute = function(name) {
    this.$el.removeAttr(name);
    return this;
  };

  this.getAttributes = function() {
    var attributes = clone(this.el.attribs);
    return attributes;
  };

  this.getProperty = function(name) {
    return this.$el.prop(name);
  };

  this.setProperty = function(name, value) {
    this.htmlProps[name] = value;
    this.$el.prop(name, value);
    return this;
  };

  // TODO: verify that this.el[name] is correct
  this.removeProperty = function(name) {
    delete this.htmlProps[name];
    delete this.el[name];
    return this;
  };

  this.getTagName = function() {
    if (this.el.type !== 'tag') {
      return "";
    } else {
      return this.el.name.toLowerCase();
    }
  };

  this.setTagName = function(tagName) {
    var newEl = $._createElement(tagName, this.el.root);
    var $newEl = $(newEl);
    $newEl.html(this.$el.html());
    newEl.attribs = extend({}, this.el.attribs);
    this._replaceNativeEl(newEl);
    return this;
  };

  this.getId = function() {
    return this.$el.attr('id');
  };

  this.setId = function(id) {
    this.$el.attr('id', id);
    return this;
  };

  this.getTextContent = function() {
    return this.$el.text();
  };

  this.setTextContent = function(text) {
    this.$el.text(text);
    return this;
  };

  this.getInnerHTML = function() {
    return this.$el.html();
  };

  this.setInnerHTML = function(html) {
    this.$el.html(html);
    return this;
  };

  this.getOuterHTML = function() {
    // TODO: this is not really jquery
    return $._serialize(this.el);
  };

  this.getValue = function() {
    return this.$el.val();
  };

  this.setValue = function(value) {
    this.$el.val(value);
    return this;
  };

  this.getStyle = function(name) {
    return this.$el.css(name);
  };

  this.setStyle = function(name, value) {
    this.$el.css(name, value);
    return this;
  };

  this.addEventListener = function() {
    return this;
  };

  this.removeEventListener = function() {
    return this;
  };

  this.removeAllEventListeners = function() {
    return this;
  };

  this.getEventListeners = function() {
    return [];
  };

  this.getChildCount = function() {
    return this.el.children.length;
  };

  this.getChildNodes = function() {
    var childNodes = this.el.children;
    childNodes = childNodes.map(function(node) {
      return this._wrapNativeElement(node);
    }.bind(this));
    return childNodes;
  };

  this.getChildren = function() {
    var children = this.el.children;
    children = children.filter(function(node) {
      return node.type === "tag";
    });
    children = children.map(function(node) {
      return this._wrapNativeElement(node);
    }.bind(this));
    return children;
  };

  this.getChildAt = function(pos) {
    return this._wrapNativeElement(this.el.children[pos]);
  };

  this.getChildIndex = function(child) {
    if (!child._isCheerioDOMElement) {
      throw new Error('Expecting a CheerioDOMElement instance.');
    }
    return this.el.children.indexOf(child.el);
  };

  this.getFirstChild = function() {
    var firstChild = this.el.children[0];
    if (firstChild) {
      return CheerioDOMElement.wrapNativeElement(firstChild);
    } else {
      return null;
    }
  };

  this.getLastChild = function() {
    var lastChild = last(this.el.children);
    if (lastChild) {
      return CheerioDOMElement.wrapNativeElement(lastChild);
    } else {
      return null;
    }
  };

  this.getNextSibling = function() {
    var next = this.el.next;
    if (next) {
      return CheerioDOMElement.wrapNativeElement(next);
    } else {
      return null;
    }
  };

  this.getPreviousSibling = function() {
    var previous = this.el.previous;
    if (previous) {
      return CheerioDOMElement.wrapNativeElement(previous);
    } else {
      return null;
    }
  };

  this.isTextNode = function() {
    // cheerio specific
    return this.el.type === "text";
  };

  this.isElementNode = function() {
    // cheerio specific
    return this.el.type === "tag";
  };

  this.isCommentNode = function() {
    // cheerio specific
    return this.el.type === "comment";
  };

  this.isDocumentNode = function() {
    return this.el === this.el.root;
  };

  this.clone = function() {
    var clone = this.$el.clone()[0];
    return this._wrapNativeElement(clone);
  };

  this.createElement = function(tagName) {
    var el = $._createElement(tagName, this.el.root);
    return this._wrapNativeElement(el);
  };

  this.createTextNode = function(text) {
    var el = $._createTextNode(text);
    return this._wrapNativeElement(el);
  };

  this.is = function(cssSelector) {
    // Note: unfortunately there is no cross-browser supported selectr matcher
    // Element.matches is not supported by all (mobile) browsers
    return this.$el.is(cssSelector);
  };

  this.getParent = function() {
    var parent = this.el.parent;
    if (parent) {
      return this._wrapNativeElement(parent);
    } else {
      return null;
    }
  };

  this.getRoot = function() {
    var el = this.el;
    var parent = el;
    while (parent) {
      el = parent;
      parent = el.parent;
    }
    return this._wrapNativeElement(el);
  };

  this.find = function(cssSelector) {
    var result = this.$el.find(cssSelector);
    if (result.length > 0) {
      return this._wrapNativeElement(result[0]);
    } else {
      return null;
    }
  };

  this.findAll = function(cssSelector) {
    var result = this.$el.find(cssSelector);
    if (result.length > 0) {
      return map(result, function(el) {
        return this._wrapNativeElement(el);
      }.bind(this));
    } else {
      return [];
    }
  };

  this._normalizeChild = function(child) {
    if (isString(child)) {
      child = this.createTextNode(child);
    }
    if (child._wrapper) {
      child = child._wrapper;
    }
    if (!child || !child._isCheerioDOMElement) {
      throw new Error('Illegal argument: only String and CheerioDOMElement instances are valid.');
    }
    console.assert(child.el._wrapper === child, "Expecting a backlink between native element and CheerioDOMElement");
    return child.getNativeElement();
  };

  this.appendChild = function(child) {
    child = this._normalizeChild(child);
    this.el.children.push(child);
    child.parent = this.el;
    return this;
  };

  this.insertAt = function(pos, child) {
    child = this._normalizeChild(child);
    var children = this.el.children;
    // NOTE: manipulating cheerio's internal children array
    // as otherwise cheerio clones the element loosing our custom data
    if (pos >= children.length) {
      children.push(child);
    } else {
      children.splice(pos, 0, child);
    }
    child.parent = this.el;
    return this;
  };

  this.insertBefore = function(child, before) {
    var pos = this.el.children.indexOf(before.el);
    if (pos > -1) {
      return this.insertAt(pos, child);
    } else {
      throw new Error('insertBefore(): reference node is not a child of this element.');
    }
  };

  this.removeAt = function(pos) {
    if (pos < 0 || pos >= this.el.children.length) {
      throw new Error('removeAt(): Index out of bounds.');
    }
    // NOTE: again manipulating cheerio's internal children array --
    // it works.
    var child = this.el.children[pos];
    child.parent = null;
    this.el.children.splice(pos, 1);
    return this;
  };

  this.removeChild = function(child) {
    if (!child || !child._isCheerioDOMElement) {
      throw new Error('removeChild(): Illegal arguments. Expecting a CheerioDOMElement instance.');
    }
    var idx = this.el.children.indexOf(child.el);
    if (idx < 0) {
      throw new Error('removeChild(): element is not a child.');
    }
    this.removeAt(idx);
    return this;
  };

  this.replaceChild = function(oldChild, newChild) {
    if (!newChild || !oldChild ||
        !newChild._isCheerioDOMElement || !oldChild._isCheerioDOMElement) {
      throw new Error('replaceChild(): Illegal arguments. Expecting BrowserDOMElement instances.');
    }
    var idx = this.el.children.indexOf(oldChild.el);
    if (idx > -1) {
      this.removeAt(idx);
      this.insertAt(idx, newChild.el);
    }
    return this;
  };

  this.empty = function() {
    this.$el.empty();
    return this;
  };

  this.remove = function() {
    this.$el.remove();
    return this;
  };

  this._replaceNativeEl = function(newEl) {
    var $newEl = $(newEl);
    this.$el.replaceWith($newEl);
    this.el = newEl;
    this.$el = $newEl;
    // HACK: we need the correct backlink
    this.el._wrapper = this;
  };

  this.isInDocument = function() {
    var el = this.el;
    while (el) {
      if (el === el.root) {
        return true;
      }
      el = el.parent;
    }
    return false;
  };

  this.click = function() {
    this.emit('click');
  };

};

DOMElement.extend(CheerioDOMElement);

DOMElement._defineProperties(CheerioDOMElement, DOMElement._propertyNames);

CheerioDOMElement.createTextNode = function(text) {
  return CheerioDOMElement.wrapNativeElement(
    $._createTextNode(text)
  );
};

CheerioDOMElement.createElement = function(tagName) {
  return CheerioDOMElement.wrapNativeElement(
    $('<' + tagName + '>')[0]
  );
};

CheerioDOMElement.parseMarkup = function(str, format) {
  var nativeEls = [];
  var doc;

  if (!str) {
    // Create an empty XML document
    if (format === 'xml') {
      doc = $.parseXML('');
    } else {
      doc = $.parseHTML('');
    }
    return new CheerioDOMElement(doc);
  } else {
    nativeEls = $.parseXML(str);
  }
  var elements = nativeEls.map(function(el) {
    return new CheerioDOMElement(el);
  });
  if (elements.length === 1) {
    return elements[0];
  } else {
    return elements;
  }
};

CheerioDOMElement.wrapNativeElement = function(el) {
  if (el._wrapper) {
    return el._wrapper;
  } else {
    return new CheerioDOMElement(el);
  }
};

export default CheerioDOMElement;
