'use strict';

var oo = require('../util/oo');
var isFunction = require('lodash/lang/isFunction');
var isObject = require('lodash/lang/isObject');
var isString = require('lodash/lang/isString');
var each = require('lodash/collection/each');

/**
  A unified interface for DOM elements used by Substance.

  There are three different implementations of this interface:
  - {@link ui/DefaultDOMElement}
  - {@link ui/VirtualDOMElement}
  - {@link ui/Component}

  Methods which rely on a CSS selector implementation are only available for {@link ui/DefaultDOMElement} instance, which is used during DOM import.
  I.e., don't use the following methods in HTML/XML exporters and Component renderers:
  - {@link ui/DOMElement#is}
  - {@link ui/DOMElement#find}
  - {@link ui/DOMElement#findAll}

  @class
  @abstract
  @interface
*/
function DOMElement() {
  // TODO: we might want to support @interface in addition to @classes?
}

DOMElement.Prototype = function() {


  /* jshint unused: false */

  /**
    Checks if a CSS class is set.

    @abstract
    @param {String} className
    @returns {Boolean} true if the CSS class is set
  */
  this.hasClass = function(className) {
    throw new Error('This method is abstract.');
  };

  /**
    Adds a CSS class.

    @abstract
    @param {String} classString A space-separated string with CSS classes
    @returns {this}
  */
  this.addClass = function(classString) {
    throw new Error('This method is abstract.');
  };

  /**
    Removes a CSS class.

    @abstract
    @param {String} classString A space-separated string with CSS classes
    @returns {this}
  */
  this.removeClass = function(classString) {
    throw new Error('This method is abstract.');
  };

  /**
    jQuery style getter and setter for attributes.

    @abstract
    @param {String} name
    @param {String} [value] if present the attribute will be set
    @returns {String|this} if used as getter the attribute value, otherwise this element for chaining
   */
  this.attr = function() {
    if (arguments.length === 1) {
      if (isString(arguments[0])) {
        return this.getAttribute(arguments[0]);
      } else if (isObject(arguments[0])) {
        each(arguments[0], function(value, name) {
          this.setAttribute(name, value);
        }, this);
      }
    } else if (arguments.length === 2) {
      this.setAttribute(arguments[0], arguments[1]);
    }
    return this;
  };

  /**
    Removes a CSS attribute.

    @abstract
    @param {String} name
    @returns {this}
  */
  this.removeAttr = function(name) {
    throw new Error('This method is abstract.');
  };

  /**
    Get the attribute with a given name.

    @abstract
    @returns {String} the attribute's value.
  */
  this.getAttribute = function(name) {
    throw new Error('This method is abstract.');
  };

  /**
    Set the attribute with a given name.

    @abstract
    @param {String} the attribute's value.
    @returns {this}
  */
  this.setAttribute = function(name, value) {
    throw new Error('This method is abstract.');
  };

  /**
    Get the tagName of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.tagName}
    @returns {String} the tag name in lower-case.
   */
  this.getTagName = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Set the tagName of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.tagName}
    @param {String} tagName the new tag name
    @returns {this}
  */
  this.setTagName = function(tagName) {
    throw new Error('This method is abstract.');
  };

  /**
    Get the id of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.id}
    @returns {String} the id.
   */
  this.getId = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Set the id of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.id}
    @param {String} id the new id
    @returns {this}
  */
  this.setId = function(id) {
    throw new Error('This method is abstract.');
  };

  /**
    Gets or sets the text content of an element.

    @abstract
    @param {String} [text] The text content to set.
    @returns {String|this} The text content if used as a getter, `this` otherwise
  */
  this.text = function(text) {
    if (arguments.length === 0) {
      return this.getTextContent();
    } else {
      return this.setTextContent(text);
    }
  };

  /**
    Get the textContent of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.innerHTML}
    @returns {String}
  */
  this.getTextContent = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Set the textContent of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.innerHTML}
    @param {String} text the new text content
    @returns {this}
  */
  this.setTextContent = function(text) {
    throw new Error('This method is abstract.');
  };

  /**
    jQuery style getter and setter for the innerHTML of an element.

    @abstract
    @param {String} [html] The html to set.
    @returns {String|this} the inner html if used as a getter, `this` otherwise
   */
  this.html = function(html) {
    if (arguments.length === 0) {
      return this.getInnerHtml();
    } else {
      return this.setInnerHtml(html);
    }
  };

  /**
    Get the innerHTML of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.innerHTML}
    @returns {String}
  */
  this.getInnerHtml = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Set the innerHTML of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.innerHTML}
    @param {String} text the new text content
    @returns {this}
  */
  this.setInnerHtml = function(html) {
    throw new Error('This method is abstract.');
  };

  /**
    Get the outerHTML of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.outerHTML}
    @returns {String}
  */
  this.getOuterHtml = function() {
    throw new Error('This method is abstract.');
  };

  /**
    jQuery style getter and setter for the *value* of an element.

    @abstract
    @param {String} [value] The value to set.
    @returns {String|this} the value if used as a getter, `this` otherwise
  */
  this.val = function(value) {
    if (arguments.length === 0) {
      return this.getValue();
    } else {
      this.setValue(value);
      return this;
    }
  };

  this.getValue = function() {
    throw new Error('This method is abstract.');
  };

  this.setValue = function(value) {
    throw new Error('This method is abstract.');
  };

  /**
    jQuery style method to set or get inline CSS styles.

    @param {String} name the style name
    @param {String} [value] the style value
    @returns {String|this} the style value or this if used as a setter
  */
  this.css = function() {
    if (arguments.length === 1) {
      if (isString(arguments[0])) {
        return this.getStyle(arguments[0]);
      } else if (isObject(arguments[0])) {
        each(arguments[0], function(value, name) {
          this.setStyle(name, value);
        }, this);
      } else {
        throw new Error('Illegal arguments.');
      }
    } else if (arguments.length === 2) {
      this.setStyle(arguments[0], arguments[1]);
    } else {
      throw new Error('Illegal arguments.');
    }
    return this;
  };

  this.getStyle = function(name) {
    throw new Error('This method is abstract.');
  };

  this.setStyle = function(name, value) {
    throw new Error('This method is abstract.');
  };

  /**
    Registers an Element event handler.

    @param {String} event The event name.
    @param {String} [selector] A css selector which is used to filter events by evaluating `event.target.is(selector)`.
    @param {Function} handler The handler function.
    @returns {this}
  */
  this.on = function(eventName, selector, handler) {
    if (!isString(eventName)) {
      throw new Error('Illegal argument: "event" must be a String.');
    }
    if (arguments.length === 2) {
      handler = arguments[1];
      selector = null;
    }
    if (selector && !isString(selector)) {
      throw new Error('Illegal argument: selector must be a string.');
    }
    if (!handler || !isFunction(handler)) {
      throw new Error('Illegal argument: invalid handler function for event ' + eventName);
    }
    this.addEventListener(eventName, selector, handler);
    return this;
  };

  /**
    Unregisters the handler of a given event.

    @param {String} event The event name.
    @returns {this}
  */
  this.off = function(eventName) {
    this.removeEventListener(eventName);
    return this;
  };

  this.addEventListener = function(eventName, selector, handler, context) {
    throw new Error('This method is abstract.');
  };

  this.removeEventListener = function(eventName) {
    throw new Error('This method is abstract.');
  };

  /**
    Focusses this element.

    **Attention: this makes only sense for elements which are rendered in the browser**

  */
  this.focus = function() {
  };

  /**
    Gets the type of this element in lower-case.

    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.nodeType}
    @returns {String}
  */
  this.getNodeType = function() {
    if (this.isTextNode()) {
      return "text";
    } else if (this.isCommentNode()) {
      return "comment";
    } else if (this.isElementNode()) {
      return "element";
    } else if (this.isDocumentNode()) {
      return "document";
    } else {
      throw new Error("Unsupported node type");
    }
  };

  /**
    Get child nodes of this element.

    @abstract
    @private Considered as private API, in favor of the property {ui/DOMElement.prototype.childNodes}
    @returns {Array<ui/DOMElement>}
   */
  this.getChildNodes = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Get child elements of this element.

    @abstract
    @private Considered as private API, in favor of the property {ui/DOMElement.prototype.children}
    @returns {Array<ui/DOMElement>}
   */
  this.getChildren = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Checks if the element is a TextNode.

    @abstract
    @returns {Boolean} true if the element is of type `Node.TEXT_NODE`
   */
  this.isTextNode = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Checks if the element is actually an element as opposed to a node.

    @abstract
    @returns {Boolean} true if the element is of type `Node.ELEMENT_NODE`
   */
  this.isElementNode = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Checks if the element is a CommentNode.

    @abstract
    @returns {Boolean} true if the element is of type `Node.COMMENT_NODE`
   */
  this.isCommentNode = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Checks if the element is a DocumentNode.

    @abstract
    @returns {Boolean} true if the element is of type `Node.DOCUMENT_NODE`
   */
  this.isDocumentNode = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Creates a clone of the current element.

    @abstract
    @returns {ui/DOMElement} A clone of this element.
  */
  this.clone = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Creates a DOMElement of the same type.

    @param {String} str a tag name or an HTML element as string.
    @returns {ui/DOMElement}
  */
  this.createElement = function(str) {
    throw new Error('This method is abstract.');
  };

  /**
    Checks if a given CSS selector matches for this element.

    **Attention**
    This method is currently not implemented for {ui/VirtualElement}.
    This means you should use it only in importer implementations.

    @abstract
    @param {String} cssSelector
    @returns {Boolean}
   */
  this.is = function(cssSelector) {
    throw new Error('This method is abstract.');
  };

  /**
    Get the parent element of this element.

    @abstract
    @returns {ui/DOMElement} the parent element
   */
  this.getParent = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Get the root ancestor element of this element.

    In the browser this is the `window.document`.

    @abstract
    @returns {ui/DOMElement} the root element
   */
  this.getRoot = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Find the first descendant element matching the given CSS selector.
    Note this differs from jQuery.find() that it returns only one element.

    **Attention**
    This method is currently not implemented for {ui/VirtualElement}.
    This means you can use it only in importer implementations, but not in render or exporter implementations.

    @abstract
    @param {String} cssSelector
    @returns {ui/DOMElement} found element
   */
  this.find = function(cssSelector) {
    throw new Error('This method is abstract.');
  };

  /**
    Find all descendant elements matching the given CSS selector.

    **Attention**
    This method is currently not implemented for {ui/VirtualElement}.
    This means you can use it only in importer implementations, but not in render or exporter implementations.

    @abstract
    @param {String} cssSelector
    @returns {Array<ui/DOMElement>} found elements
   */
  this.findAll = function(cssSelector) {
    throw new Error('This method is abstract.');
  };

  /**
    Append a child element.

    @abstract
    @param {ui/DOMElement|String} child An element or text to append
    @returns {this}
   */
  this.append = function(child) {
    throw new Error('This method is abstract.');
  };

  /**
    Insert a child element at a given position.

    @abstract
    @param {Number} pos insert position
    @param {ui/DOMElement|String} child The child element or text to insert.
    @returns {this}
  */
  this.insertAt = function(pos, child) {
    throw new Error('This method is abstract.');
  };

  /**
    Remove the child at a given position.

    @abstract
    @param {Number} pos
    @returns {this}
  */
  this.removeAt = function(pos) {
    throw new Error('This method is abstract.');
  };

  /**
    Removes all child nodes from this element.

    @abstract
    @returns {this}
  */
  this.empty = function() {
    throw new Error('This method is abstract.');
  };

  /**
    Removes this element from its parent.

    @abstract
    @returns {this}
  */
  this.remove = function() {
    throw new Error('This method is abstract.');
  };

  this.serialize = function() {
    return this.outerHTML;
  };

};

oo.initClass(DOMElement);

Object.defineProperties(DOMElement.prototype, {
  /**
    @property {String} ui/DOMElement#id
   */
  'id': {
    configurable: true,
    get: function() {
      return this.getId();
    },
    set: function(id) {
      this.setId(id);
    }
  },
  /**
    @property {String} ui/DOMElement#textContent
   */
  'textContent': {
    configurable: true,
    get: function() {
      return this.getTextContent();
    },
    set: function(text) {
      this.setTextContent(text);
    }
  },
  /**
    @property {String} ui/DOMElement#innerHTML
   */
  'innerHTML': {
    configurable: true,
    get: function() {
      return this.getInnerHtml();
    },
    set: function(html) {
      this.setInnerHtml(html);
    }
  },
  /**
    @property {String} ui/DOMElement#outerHTML
   */
  'outerHTML': {
    configurable: true,
    get: function() {
      return this.getOuterHtml();
    },
    set: function() {
      throw new Error('ui/DOMElement#outerHTML is readonly.');
    }
  },
  /**
    @property {String} ui/DOMElement#nodeType
   */
  'nodeType': {
    configurable: true,
    get: function() {
      return this.getNodeType();
    },
    set: function() {
      throw new Error('ui/DOMElement#nodeType is readonly.');
    }
  },
  /**
    @property {Array<ui/DOMElement>} ui/DOMElement#children child nodes
   */
  'childNodes': {
    configurable: true,
    get: function() {
      return this.getChildNodes();
    },
    set: function() {
      throw new Error('ui/DOMElement#childNodes is readonly.');
    }
  },
});

/**
  Parses a given HTML string.

  @param {String} html HTML string
  @returns {Array<ui/DefaultDOMElement>} parsed elements
*/
DOMElement.parseHTML = function(html) {
  var DefaultDOMElement = require('./DefaultDOMElement');
  return DefaultDOMElement.parseHTML(html);
};

DOMElement.parseXML = function(xml) {
  var DefaultDOMElement = require('./DefaultDOMElement');
  return DefaultDOMElement.parseXML(xml);
};

module.exports = DOMElement;
