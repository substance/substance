/* jshint latedef: false */

var isFunction = require('lodash/isFunction');
var isString = require('lodash/isString');
var isObject = require('lodash/isObject');
var forEach = require('lodash/forEach');
var isArray = require('lodash/isArray');
var map = require('lodash/map');
var clone = require('lodash/clone');
var extend = require('lodash/extend');
var omit = require('lodash/omit');
var without = require('lodash/without');
var DOMElement = require('./DOMElement');

/**
  A virtual {@link ui/DOMElement} which is used by the {@link ui/Component} API.

  A VirtualElement is just a description of a DOM structure. It represents a virtual
  DOM mixed with Components. This virtual structure needs to be compiled to a {@link ui/Component}
  to actually create a real DOM element.

  @class
*/
function VirtualElement(owner) {
  // set when this gets inserted into another virtual element
  this.parent = null;
  // set when created by RenderingContext
  this._owner = owner;
  // set when ref'd
  this._ref = null;
}

VirtualElement.Prototype = function() {

  /*
    For instance of like checks.
  */
  this._isVirtualElement = true;

  this.getParent = function() {
    return this.parent;
  };

  /**
    Associates a reference identifier with this element.

    When rendered the corresponding component is stored in the owner using the given key.
    In addition to that, components with a reference are preserved when its parent is rerendered.

    @param {String} ref id for the compiled Component
  */
  this.ref = function(ref) {
    if (!ref) {
      throw new Error('Illegal argument');
    }
    this._ref = ref;
    if (this._context) {
      this._context.refs[ref] = this;
    }
    return this;
  };

};

DOMElement.extend(VirtualElement);

DOMElement._defineProperties(VirtualElement, without(DOMElement._propertyNames, 'children'));

/*
  A virtual HTML element.

  @private
  @class VirtualElement.VirtualHTMLElement
  @extends ui/VirtualElement
*/
function VirtualHTMLElement(tagName) {
  VirtualHTMLElement.super.call(this);

  this._tagName = tagName;
  this.classNames = null;
  this.attributes = null;
  this.htmlProps = null;
  this.style = null;
  this.eventListeners = null;

  this.children = [];

}

VirtualHTMLElement.Prototype = function() {

  this._isVirtualHTMLElement = true;

  this.getTagName = function() {
    return this._tagName;
  };

  this.setTagName = function(tagName) {
    this._tagName = tagName;
  };

  this.hasClass = function(className) {
    if (this.classNames) {
      return this.classNames.indexOf(className) > -1;
    }
    return false;
  };

  this.addClass = function(className) {
    if (!this.classNames) {
      this.classNames = [];
    }
    this.classNames.push(className);
    return this;
  };

  this.removeClass = function(className) {
    if (this.classNames) {
      this.classNames = this.classNames.without(className);
    }
    return this;
  };

  this.removeAttr = function(attr) {
    if (this.attributes) {
      if (isString(attr)) {
        delete this.attributes[attr];
      } else {
        this.attributes = omit(this.attributes, attr);
      }
    }
    return this;
  };

  this.getAttribute = function(name) {
    if (this.attributes) {
      return this.attributes[name];
    }
  };

  this.setAttribute = function(name, value) {
    if (!this.attributes) {
      this.attributes = {};
    }
    this.attributes[name] = value;
    return this;
  };

  this.getAttributes = function() {
    // we are having separated storages for differet
    // kind of attributes which we now pull together
    // in the same way as a native DOM element has it
    var attributes = {};
    if (this.attributes) {
      extend(attributes, this.attributes);
    }
    if (this.classNames) {
      attributes.class = this.classNames.join(' ');
    }
    if (this.style) {
      attributes.style = map(this.style, function(val, key) {
        return key + ":" + val;
      }).join(';');
    }
    return attributes;
  };

  this.getId = function() {
    return this.getAttribute('id');
  };

  this.setId = function(id) {
    return this.setAttribute('id', id);
  };

  this.setTextContent = function(text) {
    text = text || '';
    this.empty();
    this.appendChild(text);
    return this;
  };

  this.setInnerHTML = function(html) {
    html = html || '';
    this.empty();
    this._innerHTMLString = html;
    return this;
  };

  this.getInnerHTML = function() {
    if (!this.hasOwnProperty('_innerHTMLString')) {
      throw new Error('Not supported.');
    } else {
      return this._innerHTMLString;
    }
  };

  this.getValue = function() {
    return this.getProperty('value');
  };

  this.setValue = function(value) {
    this.setProperty('value', value);
    return this;
  };

  this.getChildNodes = function() {
    return this.children;
  };

  this.getChildren = function() {
    return this.children.filter(function(child) {
      return child.getNodeType() !== "text";
    });
  };

  this.isTextNode = function() {
    return false;
  };

  this.isElementNode = function() {
    return true;
  };

  this.isCommentNode = function() {
    return false;
  };

  this.isDocumentNode = function() {
    return false;
  };

  this.append = function() {
    if (this._innerHTMLString) {
      throw Error('It is not possible to mix $$.html() with $$.append(). You can call $$.empty() to reset this virtual element.');
    }
    this._append(this.children, arguments);
    return this;
  };

  this.appendChild = function(child) {
    if (this._innerHTMLString) {
      throw Error('It is not possible to mix $$.html() with $$.append(). You can call $$.empty() to reset this virtual element.');
    }
    this._appendChild(this.children, child);
  };

  this.insertAt = function(pos, child) {
    child = this._normalizeChild(child);
    if (!child) {
      throw new Error('Illegal child: ' + child);
    }
    if (!child._isVirtualElement) {
      throw new Error('Illegal argument for $$.insertAt():' + child);
    }
    if (pos < 0 || pos > this.children.length) {
      throw new Error('insertAt(): index out of bounds.');
    }
    this._insertAt(this.children, pos, child);
    return this;
  };

  this.insertBefore = function(child, before) {
    var pos = this.children.indexOf(before);
    if (pos > -1) {
      this.insertAt(pos, child);
    } else {
      throw new Error('insertBefore(): reference node is not a child of this element.');
    }
    return this;
  };

  this.removeAt = function(pos) {
    if (pos < 0 || pos >= this.children.length) {
      throw new Error('removeAt(): Index out of bounds.');
    }
    this._removeAt(pos);
    return this;
  };

  this.removeChild = function(child) {
    if (!child || !child._isVirtualElement) {
      throw new Error('removeChild(): Illegal arguments. Expecting a CheerioDOMElement instance.');
    }
    var idx = this.children.indexOf(child);
    if (idx < 0) {
      throw new Error('removeChild(): element is not a child.');
    }
    this.removeAt(idx);
  };

  this.replaceChild = function(oldChild, newChild) {
    if (!newChild || !oldChild ||
        !newChild._isVirtualElement || !oldChild._isVirtualElement) {
      throw new Error('replaceChild(): Illegal arguments. Expecting BrowserDOMElement instances.');
    }
    var idx = this.children.indexOf(oldChild);
    if (idx < 0) {
      throw new Error('replaceChild(): element is not a child.');
    }
    this.removeAt(idx);
    this.insertAt(idx, newChild);
  };

  this.empty = function() {
    var children = this.children;
    while (children.length) {
      var child = children.pop();
      child.parent = null;
    }
    delete this._innerHTMLString;
    return this;
  };

  this.getHTMLProp = function(name) {
    if (this.htmlProps) {
      return this.htmlProps[name];
    }
  };

  this.setHTMLProp = function(name, value) {
    if (!this.htmlProps) {
      this.htmlProps = {};
    }
    this.htmlProps[name] = value;
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
        return this.getHTMLProp(arguments[0]);
      } else if (isObject(arguments[0])) {
        forEach(arguments[0], function(value, name) {
          this.setHTMLProp(name, value);
        }.bind(this));
      }
    } else if (arguments.length === 2) {
      this.setHTMLProp(arguments[0], arguments[1]);
    }
    return this;
  };

  this.removeHTMLProp = function(name) {
    delete this.htmlProps[name];
  };

  this.getStyle = function(name) {
    if (this.style) {
      return this.style[name];
    }
  };

  this.setStyle = function(name, value) {
    if (!this.style) {
      this.style = {};
    }
    this.style[name] = value;
  };

  this.addEventListener = function(eventName, handler, options) {
    var listener;
    if (arguments.length === 1 && arguments[0]._isDOMEventListener) {
      listener = arguments[0];
    } else {
      options = options || {};
      options.context = options.context || this._owner._comp;
      listener = new DOMElement.EventListener(eventName, handler, options);
    }
    if (!this.eventListeners) {
      this.eventListeners = [];
    }
    this.eventListeners.push(listener);
  };
  this.removeEventListener = function(eventName, handler) {
    if (this.eventListeners) {
      DOMElement._findEventListenerIndex(this.eventListeners, eventName, handler);
    }
  };

  this.getEventListeners = function() {
    return this.eventListeners;
  };

  this.getNodeType = function() {
    return "element";
  };

  this.hasInnerHTML = function() {
    return !!this._innerHTMLString;
  };

  this._normalizeChild = function(child) {
    if (isString(child)) {
      child = new VirtualTextNode(child);
    }
    return child;
  };

  this._append = function(outlet, args) {
    if (args.length === 1 && !isArray(args[0])) {
      this._appendChild(outlet, args[0]);
      return;
    }
    var children;
    if (isArray(args[0])) {
      children = args[0];
    } else if (arguments.length > 1) {
      children = Array.prototype.slice.call(args,0);
    } else {
      return;
    }
    children.forEach(this._appendChild.bind(this, outlet));
  };

  this._appendChild = function(outlet, child) {
    child = this._normalizeChild(child);
    // TODO: discuss. Having a bad feeling about this,
    // because it could obscure an implementation error
    if (!child) return;
    outlet.push(child);
    this._attach(child);
    return child;
  };

  this._insertAt = function(outlet, pos, child) {
    if (!child) return;
    outlet.splice(pos, 0, child);
    this._attach(child);
  };

  this._removeAt = function(outlet, pos) {
    var child = outlet[pos];
    outlet.splice(pos, 1);
    this._detach(child);
  };

  this._attach = function(child) {
    child.parent = this;
    if (this._context && child._owner !== this._owner && child._ref) {
      this._context.foreignRefs[child._ref] = child;
    }
  };

  this._detach = function(child) {
    child.parent = null;
    if (this._context && child._owner !== this._owner && child._ref) {
      delete this.context.foreignRefs[child._ref];
    }
  };

  this._mergeHTMLConfig = function(other) {
    if (other.classNames) {
      if (!this.classNames) {
        this.classNames = [];
      }
      this.classNames = this.classNames.concat(other.classNames);
    }
    if (other.attributes) {
      if (!this.attributes) {
        this.attributes = {};
      }
      extend(this.attributes, other.attributes);
    }
    if (other.htmlProps) {
      if (!this.htmlProps) {
        this.htmlProps = {};
      }
      extend(this.htmlProps, other.htmlProps);
    }
    if (other.style) {
      if (!this.style) {
        this.style = {};
      }
      extend(this.style, other.style);
    }
    if (other.eventListeners) {
      if (!this.eventListeners) {
        this.eventListeners = [];
      }
      this.eventListeners = this.eventListeners.concat(other.eventListeners);
    }
  };
};

VirtualElement.extend(VirtualHTMLElement);

/*
  A virtual element which gets rendered by a custom component.

  @private
  @class VirtualElement.VirtualComponent
  @extends ui/VirtualElement
*/
function VirtualComponent(ComponentClass, props) {
  VirtualComponent.super.call(this);

  props = props || {};

  this.ComponentClass = ComponentClass;
  this.props = props;
  if (!props.children) {
    props.children = [];
  }
  this.children = props.children;
}

VirtualComponent.Prototype = function() {

  this._isVirtualComponent = true;

  this.getComponent = function() {
    return this._comp;
  };

  // Note: for VirtualComponentElement we put children into props
  // so that the render method of ComponentClass can place it.
  this.getChildren = function() {
    return this.props.children;
  };

  this.getNodeType = function() {
    return 'component';
  };

  this.outlet = function(name) {
    return new Outlet(this, name);
  };

  this._attach = function() {};

  this._detach = function() {};

  this._copyHTMLConfig = function() {
    return {
      classNames: clone(this.classNames),
      attributes: clone(this.attributes),
      htmlProps: clone(this.htmlProps),
      style: clone(this.style),
      eventListeners: clone(this.eventListeners)
    };
  };

  function Outlet(virtualEl, name) {
    this.virtualEl = virtualEl;
    this.name = name;
    Object.freeze(this);
  }

  Outlet.prototype._getOutlet = function() {
    var outlet = this.virtualEl.props[this.name];
    if (!outlet) {
      outlet = [];
      this.virtualEl.props[this.name] = outlet;
    }
    return outlet;
  };

  Outlet.prototype.append = function() {
    var outlet = this._getOutlet();
    this.virtualEl._append(outlet, arguments);
    return this;
  };

  Outlet.prototype.empty = function() {
    this.virtualEl.props[this.name] = [];
  };

};

VirtualHTMLElement.extend(VirtualComponent);

function VirtualTextNode(text) {
  this.text = text;
}

VirtualTextNode.Prototype = function() {
  this._isVirtualTextNode = true;
};

VirtualElement.extend(VirtualTextNode);

VirtualElement.Component = VirtualComponent;
VirtualElement.TextNode = VirtualTextNode;

/**
  Create a virtual DOM representation which is used by Component
  for differential/reactive rendering.

  @param elementType HTML tag name or Component class
  @param [props] a properties object for Component classes
  @return {VirtualElement} a virtual DOM node

  @example

  Create a virtual DOM Element

  ```
  $$('a').attr({href: './foo'}).addClass('se-nav-item')
  ```

  Create a virtual Component

  ```
  $$(HelloMessage, {name: 'John'})
  ```
*/
VirtualElement.createElement = function() {
  var content = null;
  if (isString(arguments[0])) {
    if (arguments.length !== 1) {
      throw new Error('Illegal usage of VirtualElement.createElement()');
    }
    content = new VirtualHTMLElement(arguments[0]);
  } else if (isFunction(arguments[0]) && arguments[0].prototype._isComponent) {
    if (arguments.length < 1 || arguments.length > 2) {
      throw new Error('Illegal usage of VirtualElement.createElement()');
    }
    var props = {};
    if (arguments.length === 2) {
      props = arguments[1];
    }
    content = new VirtualComponent(arguments[0], props);
  } else if (arguments[0] === undefined) {
    throw new Error('Provided Component was undefined.');
  } else {
    throw new Error('Illegal usage of VirtualElement.createElement()');
  }
  return content;
};

module.exports = VirtualElement;
