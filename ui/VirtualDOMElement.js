/* jshint latedef: false */

var isFunction = require('lodash/lang/isFunction');
var isString = require('lodash/lang/isString');
var isArray = require('lodash/lang/isArray');
var isObject = require('lodash/lang/isObject');
var extend = require('lodash/object/extend');
var omit = require('lodash/object/omit');
var without = require('lodash/array/without');
var oo = require('../util/oo');

/**
  A virtual representation of {@link ui/DOMElements} which can be used
  to create a virtual DOM for the {@link ui/Component} API.

  For rendering the Component API is used, to compile a VirtualDOMElement
  into a {@link ui/Component} instance, which itself implements the {@link ui/DOMElement}
  interface.

  @class
*/
function VirtualDOMElement() {
  this._ref = null;
  this._isOnRoute = false;
  this.attributes = {};
  this.htmlProps = {};
  this.style = {};
  this.handlers = {};
  this.props = {};
  this.children = [];
}

VirtualDOMElement.Prototype = function() {

  // Component API

  /**
    Associates a reference identifier with this element.

    When rendered the corresponding component is stored in the owner using the given key.
    In addition to that, components with a reference are preserved when its parent is rerendered.
  */
  this.ref = function(ref) {
    this._ref = ref;
    return this;
  };

  this.key = function(key) {
    console.info('DEPRECATED: Use ref instead. Note that when you assign a ref, the component do incremental rerendering.');
    // this._key = key;
    return this.ref(key);
    // return this;
  };

  this.addProps = function(props) {
    console.log('DEPRECATED: Use setProps() or extendProps()');
    extend(this.props, props);
    return this;
  };

  this.setProps = function(props) {
    this.props = props;
    return this;
  };

  this.extendProps = function(props) {
    extend(this.props, props);
    return this;
  };

  /**
    Enable routing.
  */
  this.route = function() {
    this._isOnRoute = true;
    return this;
  };

  // DOMElement API

  // shadowing property getter/setter defined in ui/DOMElement
  this.children = null;


  this.hasClass = function(className) {
    return !!(new RegExp('\\b'+className+'\\b')).exec(this.classNames);
  };

  this.addClass = function(className) {
    if (!this.classNames) {
      this.classNames = "";
    }
    this.classNames += " " + className;
    return this;
  };

  this.removeClass = function(className) {
    if (!this.classNames) {
      this.classNames = "";
    }
    var classes = this.classNames.split(/\s+/);
    classes = without(classes, className);
    this.classNames = classes.join(' ');
    return this;
  };

  // NOTE: we need this for incremental updates
  this.toggleClass = function(className) {
    var classes = this.classNames.split(/\s+/);
    if (classes.indexOf(className) >= 0) {
      classes = without(classes, className);
    } else {
      classes.push(className);
    }
    this.classNames = classes.join(' ');
    return this;
  };

  this.attr = function() {
    if (arguments.length === 1) {
      if (isString(arguments[0])) {
        return this.getAttribute(arguments[0]);
      } else if (isObject(arguments[0])) {
        // TODO we could treat HTML attributes as special props
        // then we do need to fish attributes from custom props
        extend(this.attributes, arguments[0]);
      }
    } else if (arguments.length === 2) {
      this.setAttribute(arguments[0], arguments[1]);
    }
    return this;
  };

  // NOTE: we need this for incremental updates
  this.removeAttr = function(attr) {
    if (isString(attr)) {
      delete this.attributes[attr];
    } else {
      this.attributes = omit(this.attributes, attr);
    }
    return this;
  };

  this.getAttribute = function(name) {
    return this.attributes[name];
  };

  this.setAttribute = function(name, value) {
    this.attributes[name] = value;
    return this;
  };

  this.text = function(text) {
    if (arguments.length === 0) {
      return this.getTextContent();
    } else {
      return this.setTextContent(text);
    }
  };

  this.getTextContent = function() {
    // TODO: we could traverse children directly, and just collecting text nodes
    var el = this._compile();
    return el.text();
  };

  this.setTextContent = function(text) {
    this.children = [];
    this.children.push(new VirtualTextNode(text));
    return this;
  };

  this.html = function(html) {
    if (arguments.length === 0) {
      return this.getInnerHtml();
    } else {
      return this.setInnerHtml(html);
    }
  };

  this.getInnerHtml = function() {
    var el = this._compile();
    return el.html();
  };

  this.setInnerHtml = function(rawHtmlString) {
    this.children = [];
    this.children.push(new RawHtml(rawHtmlString));
    return this;
  };

  this.getOuterHtml = function() {
    var el = this._compile();
    return el.outerHtml;
  };

  this.val = function(value) {
    if (arguments.length === 0) {
      return this.htmlProps['value'];
    } else {
      this.htmlProps['value'] = value;
      return this;
    }
  };

  // this.getNodeType is implemented in subclasses

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
    return false;
  };

  this.isCommentNode = function() {
    return false;
  };

  this.append = function() {
    var children;
    var _children = this.children;
    if (arguments.length === 1) {
      var child = arguments[0];
      if (!child) {
        return this;
      }
      if (isArray(child)) {
        children = child;
        Component.$$.prepareChildren(children);
        Array.prototype.push.apply(_children, children);
      } else if (isString(child)) {
        _children.push(new VirtualTextNode(child));
      } else {
        _children.push(child);
      }
    } else {
      children = Array.prototype.slice.call(arguments,0);
      Component.$$.prepareChildren(children);
      Array.prototype.push.apply(_children, children);
    }
    return this;
  };

  this.insertAt = function(pos, child) {
    this.children.splice(pos, 0, child);
    return this;
  };

  this.removeAt = function(pos) {
    this.children.splice(pos, 1);
    return this;
  };

  this.empty = function() {
    this.children = [];
    return this;
  };

  // TODO: the following API needs to be considered in ui/DOMElement
  // we didn't like htmlProp, maybe we can get rid of it?

  this.htmlProp = function(properties) {
    if (arguments.length === 2) {
      this.htmlProps[arguments[0]] = arguments[1];
    } else {
      // TODO we could treat HTML attributes as special props
      // then we do need to fish attributes from custom props
      extend(this.htmlProps, properties);
    }
    return this;
  };

  // NOTE: we need this for incremental updates
  this.removeHtmlProp = function() {
    if (isString(arguments[0])) {
      delete this.htmlProps[arguments[0]];
    } else {
      this.htmlProps = omit(this.htmlProps, arguments[0]);
    }
    return this;
  };

  // TODO: this not exactly correct. IMO in jquery you can register multiple
  // handlers for the same event. But actually we do not do this. Fix when needed.
  this.on = function(event, handler) {
    if (arguments.length !== 2 || !isString(event) || !isFunction(handler)) {
      throw new Error('Illegal arguments for $$.on(event, handler).');
    }
    this.handlers[event] = handler;
    return this;
  };

  // TODO: see above.
  this.off = function(event, handler) {
    if (arguments.length !== 2 || !isString(event) || !isFunction(handler)) {
      throw new Error('Illegal arguments for $$.on(event, handler).');
    }
    delete this.handlers[event];
    return this;
  };

  this.css = function(style) {
    if (!this.style) {
      this.style = {};
    }
    if (arguments.length === 2) {
      this.style[arguments[0]] = arguments[1];
    } else {
      extend(this.style, style);
    }
    return this;
  };

  this._compile = function() {
    return Component._render(this);
  };

  this._render = this._compile;

};

oo.initClass(VirtualDOMElement);

/*
  A virtual HTML element.

  @private
  @class VirtualDOMElement.VirtualElement
  @extends ui/VirtualDOMElement
*/
function VirtualElement(tagName) {
  VirtualDOMElement.call(this);
  this.type = 'element';
  this.tagName = tagName;
}

VirtualElement.Prototype = function() {

  // shadowing the property getter setter defined in ui/DOMElement
  this.tagName = null;

  this.getTagName = function() {
    return this.tagName;
  };

  this.setTagName = function(tagName) {
    this.tagName = tagName;
    return this;
  };

  this.getNodeType = function() {
    return "element";
  };

  this.isElementNode = function() {
    return true;
  };
};
oo.inherit(VirtualElement, VirtualDOMElement);

/*
  A virtual element which gets rendered by a custom component.

  @private
  @class VirtualDOMElement.VirtualComponentElement
  @extends ui/VirtualDOMElement
*/
function VirtualComponentElement(ComponentClass) {
  VirtualDOMElement.call(this);
  this.type = 'component';
  this.ComponentClass = ComponentClass;
}

VirtualComponentElement.Prototype = function() {
  // Note: for VirtualComponentElements we put children into props
  // so that the render method of ComponentClass can place it.
  this._getChildren = function() {
    if (!this.props.children) {
      this.props.children = [];
    }
    return this.props.children;
  };

  this.getNodeType = function() {
    return 'component';
  };

  this.isElementNode = function() {
    return true;
  };

};
oo.inherit(VirtualComponentElement, VirtualDOMElement);

/*
  A virtual text node.

  @private
  @class VirtualDOMElement.VirtualTextNode
  @extends ui/VirtualDOMElement
*/
function VirtualTextNode(text) {
  VirtualDOMElement.call(this);
  this.type = 'text';
  this.props = { text: text };
}

VirtualTextNode.Prototype = function() {

  this.getTextContent = function() {
    return this.props.text;
  };

  this.setTextContent = function(text) {
    this.props.text = text;
    return this;
  };

  this.getInnerHtml = this.getTextContent;

  this.setInnerHtml = this.setTextContent;

  this.getOuterHtml = this.getTextContent;

  this.getNodeType = function() {
    return "text";
  };

  this.isTextNode = function() {
    return true;
  };

};

oo.inherit(VirtualTextNode, VirtualDOMElement);

/*
  A virtual node containing raw html.

  @private
  @class VirtualDOMElement.VirtualTextNode
  @extends ui/VirtualDOMElement
*/
function RawHtml(html) {
  this.type = 'html';
  this.html = html;
}

RawHtml.Prototype = function() {

  this.getNodeType = function() {
    return 'rawHtml';
  };

  this.getOuterHtml = function() {
    return this.html;
  };

};

oo.inherit(RawHtml, VirtualDOMElement);
