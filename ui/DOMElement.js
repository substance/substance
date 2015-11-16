'use strict';

var oo = require('../util/oo');

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
  this.attr = function(name, value) {
    throw new Error('This method is abstract.');
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
    @param {String} [val] The value to set.
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
    Gets the type of this element in lower-case.

    @abstract
    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.nodeType}
    @returns {String}
  */
  this.getNodeType = function() {
    throw new Error('This method is abstract.');
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
    Creates a clone of the current element.

    @abstract
    @returns {ui/DOMElement} A clone of this element.
  */
  this.clone = function() {
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

};

oo.initClass(DOMElement);

Object.defineProperties(DOMElement.prototype, {
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
  Creates an element for the given string.

  The string can either be a tagName or a full HTML string as supported by jQuery.

  @note {@link ui/VirtualElement.createElement} and {@link ui/Component.createElement} have a different semantics.
  @param {String} str a tagname or a html element as string
  @returns {ui/DefaultDOMElement}
*/
DOMElement.createElement = function(str) {
  var DefaultDOMElement = require('./DefaultDOMElement');
  return DefaultDOMElement.createElement(str);
};

/**
  Alias for {@link ui/DOMElement.createElement}.

  @param {String} str a tagname or a html element as string
  @returns {ui/DefaultDOMElement}
*/
DOMElement.$$ = DOMElement.createElement;

/**
  Parses a given HTML string.

  @param {String} html HTML string
  @returns {Array<ui/DefaultDOMElement>} parsed elements
*/
DOMElement.parseHtml = function(html) {
  var DefaultDOMElement = require('./DefaultDOMElement');
  return DefaultDOMElement.parseHtml(html);
};

module.exports = DOMElement;
