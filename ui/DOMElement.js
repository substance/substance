'use strict';

var oo = require('../util/oo');
var isFunction = require('lodash/isFunction');
var isObject = require('lodash/isObject');
var isString = require('lodash/isString');
var isArray = require('lodash/isArray');
var findIndex = require('lodash/findIndex');
var forEach = require('lodash/forEach');
var ArrayIterator = require('../util/ArrayIterator');

/**
  A unified interface for DOM elements used by Substance.

  There are three different implementations of this interface:
  - {@link ui/DefaultDOMElement}
  - {@link ui/VirtualDOMElement}
  - {@link ui/Component}

  Methods which rely on a CSS selector implementation are only available for {@link ui/DefaultDOMElement} instance, which is used during DOM import.
  I.e., don't use the following methods in Component renderers:
  - {@link ui/DOMElement#is}
  - {@link ui/DOMElement#find}
  - {@link ui/DOMElement#findAll}

  @class
  @abstract
  @interface
*/
function DOMElement() {

  /**
    The element's id.
    @property {String} ui/DOMElement#id
  */

  /**
    The element's tag name in lower case.
    @property {String} ui/DOMElement#tagName
  */

  /**
    @property {String} ui/DOMElement#textContent
   */

  /**
    The inner HTML string.

    @property {String} ui/DOMElement#innerHTML
   */

  /**
    The outer HTML string.

    @property {String} ui/DOMElement#outerHTML
   */

  /**
    An array of child nodes, including nodes such as TextNodes.

    @property {Array<ui/DOMElement>} ui/DOMElement#childNodes
   */

  /**
    An array of child elements.

    @property {Array<ui/DOMElement>} ui/DOMElement#children children
   */

  /**
    The computed height.

    @property {Array<ui/DOMElement>} ui/DOMElement#height
   */

  /**
    The computed width.

    @property {Array<ui/DOMElement>} ui/DOMElement#width
   */

}

DOMElement.Prototype = function() {

  this._isDOMElement = true;

  var NOT_IMPLEMENTED = 'This method is not implemented.';

  this.getNativeElement = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /* jshint unused: false */

  /**
    Checks if a CSS class is set.

    @abstract
    @param {String} className
    @returns {Boolean} true if the CSS class is set
  */
  this.hasClass = function(className) {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Adds a CSS class.

    @abstract
    @param {String} classString A space-separated string with CSS classes
    @returns {this}
  */
  this.addClass = function(classString) {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Removes a CSS class.

    @abstract
    @param {String} classString A space-separated string with CSS classes
    @returns {this}
  */
  this.removeClass = function(classString) {
    throw new Error(NOT_IMPLEMENTED);
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
        forEach(arguments[0], function(value, name) {
          this.setAttribute(name, value);
        }.bind(this));
      }
    } else if (arguments.length === 2) {
      this.setAttribute(arguments[0], arguments[1]);
    }
    return this;
  };

  /**
    Removes an attribute.

    @abstract
    @param {String} name
    @returns {this}
  */
  this.removeAttr = function(name) {
    var names = name.split(/\s+/);
    if (names.length === 1) {
      this.removeAttribute(name);
    } else {
      names.forEach(function(name) {
        this.removeAttribute(name);
      }.bind(this));
    }
    return this;
  };

  /**
    Get the attribute with a given name.

    @abstract
    @returns {String} the attribute's value.
  */
  this.getAttribute = function(name) {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Set the attribute with a given name.

    @abstract
    @param {String} the attribute's value.
    @returns {this}
  */
  this.setAttribute = function(name, value) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.removeAttribute = function(name) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.getAttributes = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    jQuery style getter and setter for HTML element properties.

    @abstract
    @param {String} name
    @param {String} [value] if present the property will be set
    @returns {String|this} if used as getter the property value, otherwise this element for chaining
   */
  this.htmlProp = function() {
    if (arguments.length === 1) {
      if (isString(arguments[0])) {
        return this.getProperty(arguments[0]);
      } else if (isObject(arguments[0])) {
        forEach(arguments[0], function(value, name) {
          this.setProperty(name, value);
        }.bind(this));
      }
    } else if (arguments.length === 2) {
      this.setProperty(arguments[0], arguments[1]);
    }
    return this;
  };

  this.getProperty = function(name) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.setProperty = function(name, value) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.removeProperty = function(name) {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Get the tagName of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.tagName}
    @returns {String} the tag name in lower-case.
   */
  this.getTagName = function() {
    throw new Error(NOT_IMPLEMENTED);
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
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Get the id of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.id}
    @returns {String} the id.
   */
  this.getId = function() {
    throw new Error(NOT_IMPLEMENTED);
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
    throw new Error(NOT_IMPLEMENTED);
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
    throw new Error(NOT_IMPLEMENTED);
  };

  this.setValue = function(value) {
    throw new Error(NOT_IMPLEMENTED);
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
        forEach(arguments[0], function(value, name) {
          this.setStyle(name, value);
        }.bind(this));
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
    throw new Error(NOT_IMPLEMENTED);
  };

  this.setStyle = function(name, value) {
    throw new Error(NOT_IMPLEMENTED);
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
    throw new Error(NOT_IMPLEMENTED);
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
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    jQuery style getter and setter for the innerHTML of an element.

    @abstract
    @param {String} [html] The html to set.
    @returns {String|this} the inner html if used as a getter, `this` otherwise
   */
  this.html = function(html) {
    if (arguments.length === 0) {
      return this.getInnerHTML();
    } else {
      this.setInnerHTML(html);
      return this;
    }
  };

  /**
    Get the innerHTML of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.innerHTML}
    @returns {String}
  */
  this.getInnerHTML = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Set the innerHTML of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.innerHTML}
    @param {String} text the new text content
    @returns {this}
  */
  this.setInnerHTML = function(html) {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Get the outerHTML of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.outerHTML}
    @returns {String}
  */
  this.getOuterHTML = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Registers an Element event handler.

    @param {String} event The event name.
    @param {String} [selector] A css selector which is used to filter events by evaluating `event.target.is(selector)`.
    @param {Function} handler The handler function.
    @returns {this}
  */
  this.on = function(eventName, handler, context, options) {
    if (!isString(eventName)) {
      throw new Error('Illegal argument: "event" must be a String.');
    }
    options = options || {};
    if (context) {
      options.context = context;
    }
    if (options.selector && !isString(options.selector)) {
      throw new Error('Illegal argument: selector must be a string.');
    }
    if (!handler || !isFunction(handler)) {
      throw new Error('Illegal argument: invalid handler function for event ' + eventName);
    }
    this.addEventListener(eventName, handler, options);
    return this;
  };

  /**
    Unregisters the handler of a given event.

    @param {String} event The event name.
    @returns {this}
  */
  this.off = function(eventName, handler) {
    // el.off(this): disconnect all listeners bound to the given context
    if (arguments.length === 1 && !isString(eventName)) {
      var context = arguments[0];
      var listeners = this.getEventListeners().filter(function(l) {
        return l.context === context;
      }).forEach(function(l) {
        this.removeEventListener(l);
      }.bind(this));
    } else {
      this.removeEventListener(eventName, handler);
    }
    return this;
  };

  this.addEventListener = function(eventName, handler, options) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.removeEventListener = function(eventName, handler) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.getEventListeners = function() {
    throw new Error(NOT_IMPLEMENTED);
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

  this.getChildCount = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Get child nodes of this element.

    This method provides a new array with wrapped native elements.
    Better use getChildAt().

    @abstract
    @private Considered as private API, in favor of the property {ui/DOMElement.prototype.childNodes}
    @returns {Array<ui/DOMElement>}
   */
  this.getChildNodes = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Get child elements of this element.

    This method provides a new array with wrapped native elements.
    Better use getChildAt().

    @abstract
    @private Considered as private API, in favor of the property {ui/DOMElement.prototype.children}
    @returns {Array<ui/DOMElement>}
   */
  this.getChildren = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.getChildAt = function(pos) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.getChildIndex = function(child) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.getChildNodeIterator = function() {
    return new ArrayIterator(this.getChildNodes());
  };

  this.getLastChild = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.getFirstChild = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.getNextSibling = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.getPreviousSibling = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Checks if the element is a TextNode.

    @abstract
    @returns {Boolean} true if the element is of type `Node.TEXT_NODE`
   */
  this.isTextNode = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Checks if the element is actually an element as opposed to a node.

    @abstract
    @returns {Boolean} true if the element is of type `Node.ELEMENT_NODE`
   */
  this.isElementNode = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Checks if the element is a CommentNode.

    @abstract
    @returns {Boolean} true if the element is of type `Node.COMMENT_NODE`
   */
  this.isCommentNode = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Checks if the element is a DocumentNode.

    @abstract
    @returns {Boolean} true if the element is of type `Node.DOCUMENT_NODE`
   */
  this.isDocumentNode = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Creates a clone of the current element.

    @abstract
    @returns {ui/DOMElement} A clone of this element.
  */
  this.clone = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Creates a DOMElement.

    @param {String} str a tag name or an HTML element as string.
    @returns {ui/DOMElement}
  */
  this.createElement = function(str) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.createTextNode = function(text) {
    throw new Error(NOT_IMPLEMENTED);
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
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Get the parent element of this element.

    @abstract
    @returns {ui/DOMElement} the parent element
   */
  this.getParent = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Get the root ancestor element of this element.

    In the browser this is the `window.document`.

    @abstract
    @returns {ui/DOMElement} the root element
   */
  this.getRoot = function() {
    throw new Error(NOT_IMPLEMENTED);
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
    throw new Error(NOT_IMPLEMENTED);
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
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Append a child element.

    @abstract
    @param {ui/DOMElement|String} child An element or text to append
    @returns {this}
   */
  this.append = function(child) {
    var children;
    if (arguments.length === 1) {
      if (isArray(child)) {
        children = child;
      } else {
        this.appendChild(child);
        return this;
      }
    } else {
      children = arguments;
    }
    if (children) {
      Array.prototype.forEach.call(children, this.appendChild.bind(this));
    }
    return this;
  };

  this.appendChild = function(child) {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Insert a child element at a given position.

    @abstract
    @param {Number} pos insert position
    @param {ui/DOMElement|String} child The child element or text to insert.
    @returns {this}
  */
  this.insertAt = function(pos, child) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.insertBefore = function(newChild, before) {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Remove the child at a given position.

    @abstract
    @param {Number} pos
    @returns {this}
  */
  this.removeAt = function(pos) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.removeChild = function(child) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.replaceChild = function(oldChild, newChild) {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.remove = function() {
    var parent = this.getParent();
    if (parent) {
      parent.removeChild(this);
    }
  };

  /**
    Removes all child nodes from this element.

    @abstract
    @returns {this}
  */
  this.empty = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  /**
    Removes this element from its parent.

    @abstract
    @returns {this}
  */
  this.remove = function() {
    throw new Error(NOT_IMPLEMENTED);
  };

  this.serialize = function() {
    return this.outerHTML;
  };

  this.isInDocument = function() {
    return false;
  };

  /**
    Focusses this element.

    **Attention: this makes only sense for elements which are rendered in the browser**

  */
  this.focus = function() {
    return this;
  };

  /**
    Blur this element.
  */
  this.blur = function() {
    return this;
  };

  /**
    Trigger a click event on this element.
  */
  this.click = function() {
    return this;
  };

  /* API to retrieve layout information */

  this.getWidth = function() {
    return 0;
  };

  this.getHeight = function() {
    return 0;
  };

  /**
    Outer height as provided by $.outerHeight(withMargin)
  */
  this.getOuterHeight = function(withMargin) {
    return 0;
  };

  /**
    Offset values as provided by $.offset()
  */
  this.getOffset = function() {
    return { top: 0, left: 0 };
  };

  /**
    Position values as provided by $.position()
  */
  this.getPosition = function() {
    return { top: 0, left: 0 };
  };

};

oo.initClass(DOMElement);


var _propertyDefinitions = {
  'id': {
    configurable: true,
    get: function() {
      return this.getId();
    },
    set: function(id) {
      this.setId(id);
    }
  },
  'tagName': {
    configurable: true,
    get: function() {
      return this.getTagName();
    },
    set: function(tagName) {
      this.setTagName(tagName);
    }
  },
  'nodeName': {
    configurable: true,
    get: function() {
      return this.getTagName();
    }
  },
  'nodeType': {
    configurable: true,
    get: function() {
      return this.getNodeType();
    },
    set: function() {
      throw new Error('ui/DOMElement#nodeType is readonly.');
    }
  },
  'textContent': {
    configurable: true,
    get: function() {
      return this.getTextContent();
    },
    set: function(text) {
      this.setTextContent(text);
    }
  },
  'innerHTML': {
    configurable: true,
    get: function() {
      return this.getInnerHTML();
    },
    set: function(html) {
      this.setInnerHTML(html);
    }
  },
  'outerHTML': {
    configurable: true,
    get: function() {
      return this.getOuterHTML();
    },
    set: function() {
      throw new Error('ui/DOMElement#outerHTML is readonly.');
    }
  },
  'childNodes': {
    configurable: true,
    get: function() {
      return this.getChildNodes();
    },
    set: function() {
      throw new Error('ui/DOMElement#childNodes is readonly.');
    }
  },
  'children': {
    configurable: true,
    get: function() {
      return this.getChildren();
    },
    set: function() {
      throw new Error('ui/DOMElement#children is readonly.');
    }
  },
  'parentNode': {
    configurable: true,
    get: function() {
      return this.getParent();
    },
    set: function() {
      throw new Error('ui/DOMElement#parentNode is readonly.');
    }
  },
  'height': {
    configurable: true,
    get: function() {
      return this.getHeight();
    },
  },
  'width': {
    configurable: true,
    get: function() {
      return this.getWidth();
    },
  },
};

DOMElement._propertyNames = Object.keys(_propertyDefinitions);

DOMElement._defineProperties = function(DOMElementClass, propertyNames) {
  propertyNames = propertyNames || DOMElement._propertyNames;
  propertyNames.forEach(function(name) {
    var def = _propertyDefinitions[name];
    if (def) {
      Object.defineProperty(DOMElementClass.prototype, name, def);
    }
  });
};

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

function DOMElementDelegator() {
  this.el = null;
}

DOMElementDelegator.Prototype = function() {

  var _delegators = {
    'getNativeElement': null,
    'hasClass': false,
    'getAttribute': null,
    'getAttributes': {},
    'getProperty': null,
    'getTagName': 'throw',
    'getId': 'throw',
    'getValue': null,
    'getStyle': null,
    'getTextContent': '',
    'getInnerHTML': '',
    'getOuterHTML': '',
    'getChildCount': 0,
    'getChildNodes': [],
    'getChildren': [],
    'getChildAt': null,
    'getParent': null,
    'getRoot': null,
    'getEventListeners': [],
    'find': null,
    'findAll': [],
    'is': false,
    'isTextNode': false,
    'isElementNode': false,
    'isCommentNode': false,
    'isDocumentNode': false,
    'isInDocument': false,
    'position': null
  };

  forEach(_delegators, function(defaultValue, method) {
    this[method] = function() {
      if (!this.el) {
        if (defaultValue === 'throw') {
          throw new Error('This component has not been rendered yet.');
        } else {
          return defaultValue;
        }
      }
      return this.el[method].apply(this.el, arguments);
    };
  }.bind(this));

  // Delegators implementing the DOMElement interface
  // these are chainable
  [
    'addClass', 'removeClass',
    'setAttribute', 'removeAttribute',
    'setProperty', 'removeProperty',
    'setTagName', 'setId', 'setValue', 'setStyle',
    'setTextContent', 'setInnerHTML',
    'addEventListener', 'removeEventListener',
    'appendChild', 'insertAt', 'insertBefore',
    'remove', 'removeAt', 'removeChild', 'replaceChild', 'empty',
    'focus', 'blur', 'click'
  ].forEach(function(method) {
    this[method] = function() {
      if (!this.el) {
        throw new Error('This component has not been rendered yet.');
      }
      this.el[method].apply(this.el, arguments);
      return this;
    };
  }.bind(this));
};

DOMElement.extend(DOMElementDelegator);
DOMElement.Delegator = DOMElementDelegator;

function DOMEventListener(eventName, handler, options) {
  if (!isString(eventName) || !isFunction(handler)) {
    throw new Error("Illegal arguments: 'eventName' must be a String, and 'handler' must be a Function.");
  }
  options = options || {};
  var origHandler = handler;
  var context = options.context;
  var capture = !!options.capture;

  if (context) {
    handler = handler.bind(context);
  }
  if (options.once === true) {
    handler = _once(this, handler);
  }

  this.eventName = eventName;
  this.originalHandler = origHandler;
  this.handler = handler;
  this.capture = capture;
  this.context = context;
  this.options = options;
  // set when this gets attached to a DOM element
  this._el = null;
}

DOMEventListener.prototype._isDOMEventListener = true;

DOMEventListener.matches = function(l1, l2) {
  return l1.eventName === l2.eventName && l1.originalHandler === l2.originalHandler;
};

function _once(listener, handler) {
  return function(event) {
    handler(event);
    listener._el.removeEventListener(listener);
  };
}

DOMElement.EventListener = DOMEventListener;

DOMElement._findEventListenerIndex = function(eventListeners, eventName, handler) {
  var idx = -1;
  if (arguments[1]._isDOMEventListener) {
    idx = eventListeners.indexOf(arguments[1]);
  } else {
    idx = findIndex(eventListeners,
      DOMEventListener.matches.bind(null, {
        eventName: eventName,
        originalHandler: handler
      })
    );
  }
  return idx;
};

function TextNode() {}

TextNode.Prototype = function() {
  this._isDOMElement = true;

  this.isTextNode = function() {
    return true;
  };

  this.getNodeType = function() {
    return 'text';
  };

  this.isElementNode =
  this.isDocumentNode =
  this.isCommentNode = function() {
    return false;
  };

  [
    'getParent', 'getNextSibling', 'getPreviousSibling',
    'text', 'getTextContent', 'setTextContent',
    'clone'
  ].forEach(function(name) {
    this[name] = DOMElement.prototype[name];
  }.bind(this));

};

oo.initClass(TextNode);

DOMElement.TextNode = TextNode;

module.exports = DOMElement;
