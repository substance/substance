/* jshint latedef: false */

var isFunction = require('lodash/lang/isFunction');
var isString = require('lodash/lang/isString');
var isArray = require('lodash/lang/isArray');
var extend = require('lodash/object/extend');
var omit = require('lodash/object/omit');
var without = require('lodash/array/without');
var oo = require('../util/oo');
var DOMElement = require('./DOMElement');

/**
  A virtual {@link ui/DOMElement} which is used for the {@link ui/Component} API.

  A VirtualDOMElement is just a description of a DOM structure. It represents a virtual
  DOM mixed with Components. This virtual structure needs to be compiled to a {@link ui/Component}
  to actually create a real DOM element.

  @class
*/
function VirtualDOMElement() {
  // html related properties
  this.attributes = {};
  this.htmlProps = {};
  this.style = {};
  this.handlers = {};
  this._children = [];

  // component related properties
  this._ref = null;
  this._isOnRoute = false;
  this.props = {};
}

VirtualDOMElement.Prototype = function() {

  // ############# Component API ################################

  /**
    Associates a reference identifier with this element.

    When rendered the corresponding component is stored in the owner using the given key.
    In addition to that, components with a reference are preserved when its parent is rerendered.

    @param {String} ref id for the compiled Component
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

  this.setProps = function(props) {
    this.props = props;
    return this;
  };

  this.extendProps = function(props) {
    extend(this.props, props);
    return this;
  };

  this.addProps = function(props) {
    console.log('DEPRECATED: Use setProps() or extendProps()');
    extend(this.props, props);
    return this;
  };

  /**
    Enables routing.
  */
  this.route = function() {
    this._isOnRoute = true;
    return this;
  };

  // ############# DOMElement API ################################

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

  // this.toggleClass = function(className) {
  //   var classes = this.classNames.split(/\s+/);
  //   if (classes.indexOf(className) >= 0) {
  //     classes = without(classes, className);
  //   } else {
  //     classes.push(className);
  //   }
  //   this.classNames = classes.join(' ');
  //   return this;
  // };

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
    return el.outerHTML;
  };

  this.getValue = function() {
    return this.htmlProps['value'];
  };

  this.setValue = function(value) {
    this.htmlProps['value'] = value;
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
        VirtualDOMElement.prepareChildren(children);
        Array.prototype.push.apply(_children, children);
      } else if (isString(child)) {
        _children.push(new VirtualTextNode(child));
      } else {
        _children.push(child);
      }
    } else {
      children = Array.prototype.slice.call(arguments,0);
      VirtualDOMElement.prepareChildren(children);
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

  this.removeHtmlProp = function() {
    if (isString(arguments[0])) {
      delete this.htmlProps[arguments[0]];
    } else {
      this.htmlProps = omit(this.htmlProps, arguments[0]);
    }
    return this;
  };

  this.on = function(event, handler) {
    // TODO: this not exactly correct. IMO in jquery you can register multiple
    // handlers for the same event. But actually we do not do this. Fix when needed.
    if (arguments.length !== 2 || !isString(event) || !isFunction(handler)) {
      throw new Error('Illegal arguments for $$.on(event, handler).');
    }
    this.handlers[event] = handler;
    return this;
  };

  this.off = function(event, handler) {
    // TODO: same issue as with this.on().
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
    var Component = require('./Component');
    return Component._render(this);
  };

  // legacy
  this._render = this._compile;

};

oo.inherit(VirtualDOMElement, DOMElement);

Object.defineProperties(VirtualDOMElement.prototype, {
  /**
    @property {Array<ui/DOMElement>} ui/DOMElement#children children elements
   */
  'children': {
    configurable: true,
    get: function() {
      return this._children;
    },
    set: function(children) {
      this._children = children;
    }
  },
});

/*
  A virtual HTML element.

  @private
  @class VirtualDOMElement.VirtualElement
  @extends ui/VirtualDOMElement
*/
function VirtualElement(tagName) {
  VirtualDOMElement.call(this);
  this.type = 'element';
  this._tagName = tagName;
}

VirtualElement.Prototype = function() {

  this.getTagName = function() {
    return this._tagName;
  };

  this.setTagName = function(tagName) {
    this._tagName = tagName;
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

Object.defineProperties(VirtualElement.prototype, {
  /**
    @property {String} ui/DOMElement#tagName
   */
  'tagName': {
    get: function() {
      return this._tagName;
    },
    set: function(tagName) {
      this._tagName = tagName;
    }
  },
});

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
  // Note: for VirtualComponentElement we put children into props
  // so that the render method of ComponentClass can place it.
  this.getChildren = function() {

  };

  this.getNodeType = function() {
    return 'component';
  };

  this.isElementNode = function() {
    return true;
  };
};

oo.inherit(VirtualComponentElement, VirtualDOMElement);

Object.defineProperties(VirtualComponentElement.prototype, {
  /**
    @property {Array<ui/DOMElement>} ui/DOMElement#children children elements
   */
  'children': {
    configurable: true,
    get: function() {
      if (!this.props.children) {
        this.props.children = [];
      }
      return this.props.children;
    },
    set: function(children) {
      this.props.children = children;
    }
  },
});


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

VirtualDOMElement.prepareChildren = function(children) {
  for (var i = 0; i < children.length; i++) {
    if(isString(children[i])) {
      children[i] = new VirtualTextNode(children[i]);
    }
    if (!children[i]) {
      throw new Error('Illegal child element', children, i);
    }
  }
};

/**
  Create a virtual DOM representation which is used by Component
  for differential/reactive rendering.

  @param elementType HTML tag name or Component class
  @param [props] a properties object for Component classes
  @return {VirtualNode} a virtual DOM node

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
VirtualDOMElement.createElement = function() {
  var Component = require('./Component');
  var content = null;
  if (isString(arguments[0])) {
    if (arguments.length !== 1) {
      throw new Error('Illegal usage of Component.$$.');
    }
    content = new VirtualElement(arguments[0]);
  } else if (isFunction(arguments[0]) && arguments[0].prototype instanceof Component) {
    if (arguments.length < 1 || arguments.length > 2) {
      throw new Error('Illegal usage of Component.$$.');
    }
    content = new VirtualComponentElement(arguments[0]);
    // EXPERIMENTAL: to reduce boilerplate, we want to allow to specifiy props as 2nd argument of $$
    if (arguments.length === 2) {
      content.setProps(arguments[1]);
    }
  } else if (arguments[0] === undefined) {
    throw new Error('Provided Component was undefined.');
  } else {
    throw new Error('Illegal usage of Component.$$.');
  }
  return content;
};

VirtualDOMElement.$$ = VirtualDOMElement.createElement;
VirtualDOMElement.VirtualTextNode = VirtualTextNode;
VirtualDOMElement.RawHtml = RawHtml;

module.exports = VirtualDOMElement;