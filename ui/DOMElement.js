/* eslint-disable no-unused-vars */
import isFunction from 'lodash/isFunction'
import isObject from 'lodash/isObject'
import isString from 'lodash/isString'
import isArray from 'lodash/isArray'
import findIndex from 'lodash/findIndex'
import forEach from 'lodash/forEach'
import ArrayIterator from '../util/ArrayIterator'

const NOT_IMPLEMENTED = 'This method is not implemented.'

/**
  A unified interface for DOM elements used by Substance.

  There are three different implementations of this interface:
  - {@link ui/DefaultDOMElement}
  - {@link ui/VirtualElement}
  - {@link ui/Component}

  Methods which rely on a CSS selector implementation are only available for {@link ui/DefaultDOMElement} instance, which is used during DOM import.
  I.e., don't use the following methods in Component renderers:
  - {@link ui/DOMElement#is()}
  - {@link ui/DOMElement#find()}
  - {@link ui/DOMElement#findAll()}

  @abstract
*/
class DOMElement {

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

  get _isDOMElement() { return true }

  getNativeElement() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Checks if a CSS class is set.

    @abstract
    @param {String} className
    @returns {Boolean} true if the CSS class is set
  */
  hasClass(className) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Adds a CSS class.

    @abstract
    @param {String} classString A space-separated string with CSS classes
    @returns {this}
  */
  addClass(classString) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Removes a CSS class.

    @abstract
    @param {String} classString A space-separated string with CSS classes
    @returns {this}
  */
  removeClass(classString) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    jQuery style getter and setter for attributes.

    @abstract
    @param {String} name
    @param {String} [value] if present the attribute will be set
    @returns {String|this} if used as getter the attribute value, otherwise this element for chaining
   */
  attr() {
    if (arguments.length === 1) {
      if (isString(arguments[0])) {
        return this.getAttribute(arguments[0])
      } else if (isObject(arguments[0])) {
        forEach(arguments[0], function(value, name) {
          this.setAttribute(name, value)
        }.bind(this))
      }
    } else if (arguments.length === 2) {
      this.setAttribute(arguments[0], arguments[1])
    }
    return this
  }

  /**
    Removes an attribute.

    @abstract
    @param {String} name
    @returns {this}
  */
  removeAttr(name) {
    var names = name.split(/\s+/)
    if (names.length === 1) {
      this.removeAttribute(name)
    } else {
      names.forEach(function(name) {
        this.removeAttribute(name)
      }.bind(this))
    }
    return this
  }

  /**
    Get the attribute with a given name.

    @abstract
    @returns {String} the attribute's value.
  */
  getAttribute(name) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Set the attribute with a given name.

    @abstract
    @param {String} the attribute's value.
    @returns {this}
  */
  setAttribute(name, value) {
    throw new Error(NOT_IMPLEMENTED)
  }

  removeAttribute(name) {
    throw new Error(NOT_IMPLEMENTED)
  }

  getAttributes() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    jQuery style getter and setter for HTML element properties.

    @abstract
    @param {String} name
    @param {String} [value] if present the property will be set
    @returns {String|this} if used as getter the property value, otherwise this element for chaining
   */
  htmlProp() {
    if (arguments.length === 1) {
      if (isString(arguments[0])) {
        return this.getProperty(arguments[0])
      } else if (isObject(arguments[0])) {
        forEach(arguments[0], function(value, name) {
          this.setProperty(name, value)
        }.bind(this))
      }
    } else if (arguments.length === 2) {
      this.setProperty(arguments[0], arguments[1])
    }
    return this
  }

  getProperty(name) {
    throw new Error(NOT_IMPLEMENTED)
  }

  setProperty(name, value) {
    throw new Error(NOT_IMPLEMENTED)
  }

  removeProperty(name) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Get the tagName of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.tagName}
    @returns {String} the tag name in lower-case.
   */
  getTagName() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Set the tagName of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.tagName}
    @param {String} tagName the new tag name
    @returns {this}
  */
  setTagName(tagName) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Get the id of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.id}
    @returns {String} the id.
   */
  getId() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Set the id of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.id}
    @param {String} id the new id
    @returns {this}
  */
  setId(id) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    jQuery style getter and setter for the *value* of an element.

    @abstract
    @param {String} [value] The value to set.
    @returns {String|this} the value if used as a getter, `this` otherwise
  */
  val(value) {
    if (arguments.length === 0) {
      return this.getValue()
    } else {
      this.setValue(value)
      return this
    }
  }

  getValue() {
    throw new Error(NOT_IMPLEMENTED)
  }

  setValue(value) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    jQuery style method to set or get inline CSS styles.

    @param {String} name the style name
    @param {String} [value] the style value
    @returns {String|this} the style value or this if used as a setter
  */
  css() {
    if (arguments.length === 1) {
      if (isString(arguments[0])) {
        return this.getStyle(arguments[0])
      } else if (isObject(arguments[0])) {
        forEach(arguments[0], function(value, name) {
          this.setStyle(name, value)
        }.bind(this))
      } else {
        throw new Error('Illegal arguments.')
      }
    } else if (arguments.length === 2) {
      this.setStyle(arguments[0], arguments[1])
    } else {
      throw new Error('Illegal arguments.')
    }
    return this
  }

  getStyle(name) {
    throw new Error(NOT_IMPLEMENTED)
  }

  setStyle(name, value) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Gets or sets the text content of an element.

    @abstract
    @param {String} [text] The text content to set.
    @returns {String|this} The text content if used as a getter, `this` otherwise
  */
  text(text) {
    if (arguments.length === 0) {
      return this.getTextContent()
    } else {
      this.setTextContent(text)
    }
    return this
  }

  /**
    Get the textContent of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.innerHTML}
    @returns {String}
  */
  getTextContent() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Set the textContent of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {ui/DOMElement.prototype.innerHTML}
    @param {String} text the new text content
    @returns {this}
  */
  setTextContent(text) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    jQuery style getter and setter for the innerHTML of an element.

    @abstract
    @param {String} [html] The html to set.
    @returns {String|this} the inner html if used as a getter, `this` otherwise
   */
  html(html) {
    if (arguments.length === 0) {
      return this.getInnerHTML()
    } else {
      this.setInnerHTML(html)
    }
    return this
  }

  /**
    Get the innerHTML of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.innerHTML}
    @returns {String}
  */
  getInnerHTML() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Set the innerHTML of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.innerHTML}
    @param {String} text the new text content
    @returns {this}
  */
  setInnerHTML(html) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Get the outerHTML of this element.

    @abstract
    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.outerHTML}
    @returns {String}
  */
  getOuterHTML() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Registers an Element event handler.

    @param {String} event The event name.
    @param {Function} handler The handler function.
    @param {Object} [context] context where the function should be bound to
    @param {Object} [options]
    @param {Object} [options.selector] for event delegation
    @param {Object} [options.capture] to register the event in the event's capture phase (bubbling top-down)
    @returns {this}
  */
  on(eventName, handler, context, options) {
    if (!isString(eventName)) {
      throw new Error('Illegal argument: "event" must be a String.')
    }
    options = options || {}
    if (context) {
      options.context = context
    }
    if (options.selector && !isString(options.selector)) {
      throw new Error('Illegal argument: selector must be a string.')
    }
    if (!handler || !isFunction(handler)) {
      throw new Error('Illegal argument: invalid handler function for event ' + eventName)
    }
    this.addEventListener(eventName, handler, options)
    return this
  }

  /**
    Unregisters the handler of a given event.

    @param {String} event The event name.
    @returns {this}
  */
  off(eventName, handler) {
    // el.off(this): disconnect all listeners bound to the given context
    if (arguments.length === 1 && !isString(eventName)) {
      var context = arguments[0]
      var listeners = this.getEventListeners().filter(function(l) {
        return l.context === context
      }).forEach(function(l) {
        this.removeEventListener(l)
      }.bind(this))
    } else {
      this.removeEventListener(eventName, handler)
    }
    return this
  }

  addEventListener(eventName, handler, options) {
    throw new Error(NOT_IMPLEMENTED)
  }

  removeEventListener(eventName, handler) {
    throw new Error(NOT_IMPLEMENTED)
  }

  getEventListeners() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Gets the type of this element in lower-case.

    @private
    @note Considered as private API, in favor of the property {@link ui/DOMElement.prototype.nodeType}
    @returns {String}
  */
  getNodeType() {
    if (this.isTextNode()) {
      return "text"
    } else if (this.isCommentNode()) {
      return "comment"
    } else if (this.isElementNode()) {
      return "element"
    } else if (this.isDocumentNode()) {
      return "document"
    } else {
      throw new Error("Unsupported node type")
    }
  }

  getChildCount() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Get child nodes of this element.

    This method provides a new array with wrapped native elements.
    Better use getChildAt().

    @abstract
    @private Considered as private API, in favor of the property {ui/DOMElement.prototype.childNodes}
    @returns {Array<ui/DOMElement>}
   */
  getChildNodes() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Get child elements of this element.

    This method provides a new array with wrapped native elements.
    Better use getChildAt().

    @abstract
    @private Considered as private API, in favor of the property {ui/DOMElement.prototype.children}
    @returns {Array<ui/DOMElement>}
   */
  getChildren() {
    throw new Error(NOT_IMPLEMENTED)
  }

  getChildAt(pos) {
    throw new Error(NOT_IMPLEMENTED)
  }

  getChildIndex(child) {
    throw new Error(NOT_IMPLEMENTED)
  }

  getChildNodeIterator() {
    return new ArrayIterator(this.getChildNodes())
  }

  getLastChild() {
    throw new Error(NOT_IMPLEMENTED)
  }

  getFirstChild() {
    throw new Error(NOT_IMPLEMENTED)
  }

  getNextSibling() {
    throw new Error(NOT_IMPLEMENTED)
  }

  getPreviousSibling() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Checks if the element is a TextNode.

    @abstract
    @returns {Boolean} true if the element is of type `Node.TEXT_NODE`
   */
  isTextNode() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Checks if the element is actually an element as opposed to a node.

    @abstract
    @returns {Boolean} true if the element is of type `Node.ELEMENT_NODE`
   */
  isElementNode() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Checks if the element is a CommentNode.

    @abstract
    @returns {Boolean} true if the element is of type `Node.COMMENT_NODE`
   */
  isCommentNode() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Checks if the element is a DocumentNode.

    @abstract
    @returns {Boolean} true if the element is of type `Node.DOCUMENT_NODE`
   */
  isDocumentNode() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Creates a clone of the current element.

    @abstract
    @returns {ui/DOMElement} A clone of this element.
  */
  clone() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Creates a DOMElement.

    @param {String} str a tag name or an HTML element as string.
    @returns {ui/DOMElement}
  */
  createElement(str) {
    throw new Error(NOT_IMPLEMENTED)
  }

  createTextNode(text) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Checks if a given CSS selector matches for this element.

    **Attention**
    This method is currently not implemented for {ui/VirtualElement}.
    This means you should use it only in importer implementations.

    @abstract
    @param {String} cssSelector
    @returns {Boolean}
   */
  is(cssSelector) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Get the parent element of this element.

    @abstract
    @returns {ui/DOMElement} the parent element
   */
  getParent() {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Get the root ancestor element of this element.

    In the browser this is the `window.document`.

    @abstract
    @returns {ui/DOMElement} the root element
   */
  getRoot() {
    throw new Error(NOT_IMPLEMENTED)
  }

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
  find(cssSelector) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Find all descendant elements matching the given CSS selector.

    **Attention**
    This method is currently not implemented for {ui/VirtualElement}.
    This means you can use it only in importer implementations, but not in render or exporter implementations.

    @abstract
    @param {String} cssSelector
    @returns {Array<ui/DOMElement>} found elements
   */
  findAll(cssSelector) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Append a child element.

    @abstract
    @param {ui/DOMElement|String} child An element or text to append
    @returns {this}
   */
  append(child) {
    var children
    if (arguments.length === 1) {
      if (isArray(child)) {
        children = child
      } else {
        this.appendChild(child)
        return this
      }
    } else {
      children = arguments
    }
    if (children) {
      Array.prototype.forEach.call(children, this.appendChild.bind(this))
    }
    return this
  }

  appendChild(child) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Insert a child element at a given position.

    @abstract
    @param {Number} pos insert position
    @param {ui/DOMElement|String} child The child element or text to insert.
    @returns {this}
  */
  insertAt(pos, child) {
    throw new Error(NOT_IMPLEMENTED)
  }

  insertBefore(newChild, before) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Remove the child at a given position.

    @abstract
    @param {Number} pos
    @returns {this}
  */
  removeAt(pos) {
    throw new Error(NOT_IMPLEMENTED)
  }

  removeChild(child) {
    throw new Error(NOT_IMPLEMENTED)
  }

  replaceChild(oldChild, newChild) {
    throw new Error(NOT_IMPLEMENTED)
  }

  /**
    Removes this element from its parent.

    @abstract
    @returns {this}
  */
  remove() {
    var parent = this.getParent()
    if (parent) {
      parent.removeChild(this)
    }
  }

  /**
    Removes all child nodes from this element.

    @abstract
    @returns {this}
  */
  empty() {
    throw new Error(NOT_IMPLEMENTED)
  }

  serialize() {
    return this.outerHTML
  }

  isInDocument() {
    return false
  }

  /**
    Focusses this element.

    **Attention: this makes only sense for elements which are rendered in the browser**

  */
  focus() {
    return this
  }

  /**
    Blur this element.
  */
  blur() {
    return this
  }

  /**
    Trigger a click event on this element.
  */
  click() {
    return this
  }

  /* API to retrieve layout information */

  getWidth() {
    return 0
  }

  getHeight() {
    return 0
  }

  /**
    Outer height as provided by $.outerHeight(withMargin)
  */
  getOuterHeight(withMargin) {
    return 0
  }

  /**
    Offset values as provided by $.offset()
  */
  getOffset() {
    return { top: 0, left: 0 }
  }

  /**
    Position values as provided by $.position()
  */
  getPosition() {
    return { top: 0, left: 0 }
  }

  /**
    Get element factory conveniently

    @example

    var $$ = el.getElementFactory()
    $$('div').append('bla')
  */
  getElementFactory() {
    return this.createElement.bind(this)
  }

}

var _propertyDefinitions = {
  'id': {
    configurable: true,
    get: function() {
      return this.getId()
    },
    set: function(id) {
      this.setId(id)
    }
  },
  'tagName': {
    configurable: true,
    get: function() {
      return this.getTagName()
    },
    set: function(tagName) {
      this.setTagName(tagName)
    }
  },
  'nodeName': {
    configurable: true,
    get: function() {
      return this.getTagName()
    }
  },
  'nodeType': {
    configurable: true,
    get: function() {
      return this.getNodeType()
    },
    set: function() {
      throw new Error('ui/DOMElement#nodeType is readonly.')
    }
  },
  'textContent': {
    configurable: true,
    get: function() {
      return this.getTextContent()
    },
    set: function(text) {
      this.setTextContent(text)
    }
  },
  'innerHTML': {
    configurable: true,
    get: function() {
      return this.getInnerHTML()
    },
    set: function(html) {
      this.setInnerHTML(html)
    }
  },
  'outerHTML': {
    configurable: true,
    get: function() {
      return this.getOuterHTML()
    },
    set: function() {
      throw new Error('ui/DOMElement#outerHTML is readonly.')
    }
  },
  'childNodes': {
    configurable: true,
    get: function() {
      return this.getChildNodes()
    },
    set: function() {
      throw new Error('ui/DOMElement#childNodes is readonly.')
    }
  },
  'children': {
    configurable: true,
    get: function() {
      return this.getChildren()
    },
    set: function() {
      throw new Error('ui/DOMElement#children is readonly.')
    }
  },
  'parentNode': {
    configurable: true,
    get: function() {
      return this.getParent()
    },
    set: function() {
      throw new Error('ui/DOMElement#parentNode is readonly.')
    }
  },
  'height': {
    configurable: true,
    get: function() {
      return this.getHeight()
    },
  },
  'width': {
    configurable: true,
    get: function() {
      return this.getWidth()
    },
  },
}

DOMElement._propertyNames = Object.keys(_propertyDefinitions)

DOMElement._defineProperties = function(DOMElementClass, propertyNames) {
  propertyNames = propertyNames || DOMElement._propertyNames
  propertyNames.forEach(function(name) {
    var def = _propertyDefinitions[name]
    if (def) {
      Object.defineProperty(DOMElementClass.prototype, name, def)
    }
  })
}

class DOMElementDelegator extends DOMElement {
  constructor() {
    super()

    this.el = null
  }
}

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
}

forEach(_delegators, function(defaultValue, method) {
  DOMElementDelegator.prototype[method] = function() {
    if (!this.el) {
      if (defaultValue === 'throw') {
        throw new Error('This component has not been rendered yet.')
      } else {
        return defaultValue
      }
    }
    return this.el[method].apply(this.el, arguments)
  }
})

// Delegators implementing the DOMElement interface
// these are chainable
;[
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
  DOMElementDelegator.prototype[method] = function() {
    if (!this.el) {
      throw new Error('This component has not been rendered yet.')
    }
    this.el[method].apply(this.el, arguments)
    return this
  }
})

DOMElement.Delegator = DOMElementDelegator

class DOMEventListener {
  constructor(eventName, handler, options) {
    if (!isString(eventName) || !isFunction(handler)) {
      throw new Error("Illegal arguments: 'eventName' must be a String, and 'handler' must be a Function.")
    }
    options = options || {}
    var origHandler = handler
    var context = options.context
    var capture = Boolean(options.capture)

    if (context) {
      handler = handler.bind(context)
    }
    if (options.once === true) {
      handler = _once(this, handler)
    }

    this.eventName = eventName
    this.originalHandler = origHandler
    this.handler = handler
    this.capture = capture
    this.context = context
    this.options = options
    // set when this gets attached to a DOM element
    this._el = null
  }

  get _isDOMEventListener() { return true }

}

DOMEventListener.matches = function(l1, l2) {
  return l1.eventName === l2.eventName && l1.originalHandler === l2.originalHandler
}

function _once(listener, handler) {
  return function(event) {
    handler(event)
    listener._el.removeEventListener(listener)
  }
}

DOMElement.EventListener = DOMEventListener

DOMElement._findEventListenerIndex = function(eventListeners, eventName, handler) {
  var idx = -1
  if (arguments[1]._isDOMEventListener) {
    idx = eventListeners.indexOf(arguments[1])
  } else {
    idx = findIndex(eventListeners,
      DOMEventListener.matches.bind(null, {
        eventName: eventName,
        originalHandler: handler
      })
    )
  }
  return idx
}

class TextNode {

  get _isDOMElement() { return true }

  isTextNode() {
    return true
  }

  getNodeType() {
    return 'text'
  }

  isElementNode() { return false }

  isDocumentNode() { return false }

  isCommentNode() { return false }

}

[
  'getParent', 'getNextSibling', 'getPreviousSibling',
  'text', 'getTextContent', 'setTextContent',
  'clone'
].forEach(function(name) {
  TextNode.prototype[name] = DOMElement.prototype[name]
})


DOMElement.TextNode = TextNode

export default DOMElement
