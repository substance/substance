'use strict';

var isString = require('lodash/isString');
var isFunction = require('lodash/isFunction');
var extend = require('lodash/extend');
var each = require('lodash/each');
var without = require('lodash/without');
var EventEmitter = require('../util/EventEmitter');
var RenderingEngine = require('./RenderingEngine');
var VirtualElement = require('./VirtualElement');
var DOMElement = require('./DOMElement');
var DefaultDOMElement = require('./DefaultDOMElement');
var I18n = require('./i18n');
var inBrowser = require('../util/inBrowser');

var __id__ = 0;

/**
  A light-weight component implementation inspired by React and Ember. In contrast to the
  large frameworks it does much less things automagically in favour of synchronous
  rendering and a minimalistic life-cycle. It also provides *up-tree*
  communication and *dependency injection*.

  Concepts:

  - `props` are provided by a parent component.  An initial set of properties is provided
  via constructor. After that, the parent component can call `setProps` or `extendProps`
  to update these properties which triggers rerendering if the properties change.

  - `state` is a set of flags and values which are used to control how the component
  gets rendered given the current props. Using `setState` the component can change
  its internal state, which leads to a rerendering if the state changes.

  - A child component with a `ref` id will be reused on rerender. All others will be
  wiped and rerender from scratch. If you want to preserve a grand-child (or lower), then
  make sure that all anchestors have a ref id. After rendering the child will be
  accessible via `this.refs[ref]`.

  - A component can send actions via `send` which are bubbled up through all parent
  components until one handles it.

  @class
  @abstract
  @extends ui/DOMElement
  @implements util/EventEmitter

  @example

  Define a component:

  ```
  var HelloMessage = Component.extend({
    render: function() {
      return $$('div').append(
        'Hello ',
        this.props.name
      );
    }
  });
  ```

  And mount it to a DOM Element:

  ```
  Component.mount(
    $$(HelloMessage, {name: 'John'}),
    document.body
  );
  ```
*/
function Component(parent, props) {
  EventEmitter.call(this);
  this.__id__ = __id__++;

  this.parent = parent;
  this.el = null;
  this.refs = {};
    // HACK: a temporary solution to handle refs owned by an ancestor
    // is to store them here as well, so that we can map virtual components
    // efficiently
  this.__foreignRefs__ = {};
  this._actionHandlers = {};

  // available after first rendering which allows to create VirtualElements
  // that can be used with this.insertAt() andthis.append()
  this.$$ = null;

  // context from parent (dependency injection)
  this._setContext(this._getContext());
  this._setProps(props);
  this._setState(this._getInitialState());
}

Component.Prototype = function() {

  extend(this, EventEmitter.prototype);

  this._isComponent = true;

  // Experimental (we need this to initialize the Router)
  this.getInitialContext = function() {
    return {};
  };

  /**
    Provides the context which is delivered to every child component. Override if you want to
    provide your own child context.

    @return object the child context
  */
  this.getChildContext = function() {
    return this.childContext || {};
  };

  /**
    Provide the initial component state.

    @return object the initial state
  */
  this.getInitialState = function() {
    return {};
  };

  /**
    Provides the parent of this component.

    @return object the parent component or null if this component does not have a parent.
  */
  this.getParent = function() {
    return this.parent;
  };

  this.getRoot = function() {
    var comp = this;
    var parent = comp;
    while (parent) {
      comp = parent;
      parent = comp.getParent();
    }
    return comp;
  };

  /**
    Render the component.

    ATTENTION: this does not create a DOM presentation but
    a virtual representation which is compiled into a DOM element later.

    Every Component should override this method.

    @param {Function} $$ method to create components
    @return {VirtualNode} VirtualNode created using $$
   */
  this.render = function($$) {
    /* jshint unused:false */
    /* istanbul ignore next */
    return $$('div');
  };

  this.mount = function(el) {
    if (!this.el) {
      this.rerender();
    }
    if (!el._isDOMElement) {
      el = DefaultDOMElement.wrapNativeElement(el);
    }
    el.appendChild(this.el);
    if (el.isInDocument()) {
      this.triggerDidMount(true);
    }
    return this;
  };

  /**
   * Determines if Component.rerender() should be run after
   * changing props or state.
   *
   * The default implementation performs a deep equal check.
   *
   * @return a boolean indicating whether rerender() should be run.
   */
  this.shouldRerender = function(newProps) {
    /* jshint unused: false */
    return true;
  };

  /**
   * Rerenders the component.
   *
   * Call this to manually trigger a rerender.
   */
  this.rerender = function() {
    if (this.__isRendering__) {
      throw new Error('Component is rendering already.');
    }
    this.__isRendering__ = true;
    try {
      this.willRender();
      var engine = new RenderingEngine();
      engine._rerender(this);
      this.didRender();
    } finally {
      delete this.__isRendering__;
    }
  };

  /**
   * Triggers didMount handlers recursively.
   *
   * Gets called when using `component.mount(el)` on an element being
   * in the DOM already. Typically this is done for a root component.
   *
   * If this is not possible because you want to do things differently, make sure
   * you call 'component.triggerDidMount()' on root components.
   *
   * @param isMounted an optional param for optimization, it's used mainly internally
   * @private
   * @example
   *
   * ```
   * var frag = document.createDocumentFragment();
   * var comp = Component.mount($$(MyComponent), frag);
   * ...
   * $('body').append(frag);
   * comp.triggerDidMount();
   * ```
   */
  this.triggerDidMount = function() {
    // Trigger didMount for the children first
    this.getChildren().forEach(function(child) {
      // We pass isMounted=true to save costly calls to Component.isMounted
      // for each child / grandchild
      child.triggerDidMount(true);
    });
    // To prevent from multiple calls to didMount, which can happen under
    // specific circumstances we use a guard.
    if (!this.__isMounted__) {
      this.didMount();
      this.__isMounted__ = true;
    }
  };

  /**
   * Called when the element is inserted into the DOM.
   *
   * Node: make sure that you call `component.mount(el)` using an element
   * which is already in the DOM.
   *
   * @example
   *
   * ```
   * var component = new MyComponent();
   * component.mount($('body')[0])
   * ```
   */
  this.didMount = function() {};

  /**
    Checks whether a given element has been injected in the document already

    We traverse up the DOM until we find the document root element. We return true
    if we can find it.

    @return a boolean indicating if this component is mounted.
   */
  this.isMounted = function() {
    // Not rendered yet, so can not be mounted
    return this.el.isInDocument();
  };

  /**
   * Triggers dispose handlers recursively.
   *
   * @private
   */
  this.triggerDispose = function() {
    this.getChildren().forEach(function(child) {
      child.triggerDispose();
    });
    this.__isMounted__ = false;
    this.dispose();
  };

  /**
    A hook which is called when the component is unmounted, i.e. removed from DOM, hence disposed
   */
  this.dispose = function() {};

  /**
    Send an action request to the parent component, bubbling up the component
    hierarchy until an action handler is found.

    @param action the name of the action
    @param ... arbitrary number of arguments
    @returns {Boolean} true if the action was handled, false otherwise
    @example
  */
  this.send = function(action) {
    var comp = this;
    while(comp) {
      if (comp._actionHandlers[action]) {
        comp._actionHandlers[action].apply(comp, Array.prototype.slice.call(arguments, 1));
        return true;
      }
      comp = comp.getParent();
    }
    console.warn('Action', action, 'was not handled.');
    return false;
  };

  /**
    Define action handlers. Call this during construction/initialization of a component.

    @example

    ```
    function MyComponent() {
      Component.apply(this, arguments);
      ...
      this.handleActions({
       'openPrompt': this.openPrompt,
       'closePrompt': this.closePrompt
      });
    }
    ```
  */
  this.handleActions = function(actionHandlers) {
    each(actionHandlers, function(method, actionName) {
      this.handleAction(actionName, method);
    }.bind(this));
    return this;
  };

  /**
    Define an action handler. Call this during construction/initialization of a component.

    @param {String} action name
    @param {Functon} a function of this component.
  */
  this.handleAction = function(name, handler) {
    if (!name || !handler || !isFunction(handler)) {
      throw new Error('Illegal arguments.');
    }
    handler = handler.bind(this);
    this._actionHandlers[name] = handler;
  };

  /**
    Sets the state of this component, potentially leading to a rerender.

    Usually this is used by the component itself.
  */
  this.setState = function(newState) {
    // Note: while setting props it is allowed to call this.setState()
    // which will not lead to an extra rerender
    var needRerender = !this.__isSettingProps__ &&
      this.shouldRerender(this.getProps(), newState);
    this._setState(newState);
    if (needRerender) {
      this.rerender();
    }
  };

  /**
    This is similar to `setState()` but extends the existing state instead of replacing it.
    @param {object} newState an object with a partial update.
  */
  this.extendState = function(newState) {
    newState = extend({}, this.state, newState);
    this.setState(newState);
  };

  /**
    Hook which is called before the state is changed.
    Use this to dispose objects which will be replaced during a state change.
  */
  this.willUpdateState = function(newState) { /* jshint unused: false */ };

  /**
    Hook which is called after the state has updated.
  */
  this.didUpdateState = function() {};

  /**
    Sets the properties of this component, potentially leading to a rerender.

    @param {object} an object with properties
  */
  this.setProps = function(newProps) {
    var needRerender = this.shouldRerender(newProps, this.state);
    this._setProps(newProps);
    if (needRerender) {
      this.rerender();
    }
  };

  this._setProps = function(newProps) {
    newProps = newProps || {};
    // set a flag so that this.setState() can omit triggering render
    this.__isSettingProps__ = true;
    try {
      this.willReceiveProps(newProps);
      this.props = newProps || {};
      Object.freeze(newProps);
      this.didReceiveProps();
    } finally {
      delete this.__isSettingProps__;
    }
  };

  /**
    Extends the properties of the component, without reppotentially leading to a rerender.

    @param {object} an object with properties
  */
  this.extendProps = function(updatedProps) {
    var newProps = extend({}, this.props, updatedProps);
    this.setProps(newProps);
  };

  /**
    Get the current properties

    @return {Object} the current state
  */
  this.getProps = function() {
    return this.props;
  };

  /**
    Get the current component state

    @return {Object} the current state
  */
  this.getState = function() {
    return this.state;
  };

  /**
    Hook which is called before properties are updated. Use this to dispose objects which will be replaced when properties change.
  */
  this.willReceiveProps = function(newProps) { /* jshint unused: false */ };

  /**
    Hook which is called after properties have been set.

    Use this to derive state from props.
  */
  this.didReceiveProps = function() {};

  /**
    Hook which is called before each render.
  */
  this.willRender = function() {};

  /**
    Hook which is called after each render.
  */
  this.didRender = function() {};

  this.getChildNodes = function() {
    if (!this.el) return [];
    var childNodes = this.el.getChildNodes();
    childNodes = childNodes.map(_unwrapComp).filter(notNull);
    return childNodes;
  };

  this.getChildren = function() {
    if (!this.el) return [];
    var children = this.el.getChildren();
    children = children.map(_unwrapComp).filter(notNull);
    return children;
  };

  this.getChildAt = function(pos) {
    var node = this.el.getChildAt(pos);
    return _unwrapCompStrict(node);
  };

  this.find = function(cssSelector) {
    var el = this.el.find(cssSelector);
    return _unwrapComp(el);
  };

  this.findAll = function(cssSelector) {
    var els = this.el.findAll(cssSelector);
    return els.map(_unwrapComp).filter(notNull);
  };

  this.appendChild = function(child) {
    this.insertAt(this.getChildCount(), child);
  };

  this.insertAt = function(pos, child) {
    if (isString(child)) {
      child = new VirtualElement.TextNode(child);
    }
    if (!child._isVirtualElement) {
      throw new Error('Invalid argument: "child" must be a VirtualElement.');
    }
    var comp = new RenderingEngine()._renderChild(this, child);
    this.el.insertAt(pos, comp.el);
    if (this.isMounted()) {
      comp.triggerDidMount(true);
    }
  };

  this.removeAt = function(pos) {
    var childEl = this.el.getChildAt(pos);
    if (childEl) {
      var comp = _unwrapCompStrict(childEl);
      comp.triggerDispose();
      this.el.removeAt(pos);
    }
  };

  this.removeChild = function(child) {
    if (!child || !child._isComponent) {
      throw new Error('removeChild(): Illegal arguments. Expecting a Component instance.');
    }
    child.triggerDispose();
    this.el.removeChild(child.el);
  };

  this.replaceChild = function(oldChild, newChild) {
    if (!newChild || !oldChild ||
        !newChild._isComponent || !oldChild._isComponent) {
      throw new Error('replaceChild(): Illegal arguments. Expecting BrowserDOMElement instances.');
    }
    // Attention: Node.replaceChild has weird semantics
    oldChild.triggerDispose();
    this.el.replaceChild(newChild.el, oldChild.el);
    if (this.isMounted()) {
      newChild.triggerDidMount(true);
    }
  };

  this.empty = function() {
    if (this.el) {
      this.childNodes.forEach(function(child) {
        child.triggerDispose();
      });
      this.el.empty();
    }
    return this;
  };

  this.remove = function() {
    this.triggerDispose();
    this.el.remove();
  };

  this._getInitialState = function() {
    if (this.context.router) {
      var state = this.context.router.getInitialState(this);
      if (state) {
        return state;
      }
    }
    return this.getInitialState();
  };

  this._getContext = function() {
    var parent = this.getParent();
    var context = this.getInitialContext();
    if (parent) {
      context = extend({}, parent.context, context);
      if (parent.getChildContext) {
        return extend(context, parent.getChildContext());
      }
      return context;
    }
    return context;
  };

  this._setContext = function(context) {
    this.context = context || {};
    Object.freeze(this.context);
  };

  this._setState = function(newState) {
    this.willUpdateState(newState);
    this.state = newState || {};
    Object.freeze(this.state);
    this.didUpdateState();
  };

  function _unwrapComp(el) {
    if (el) return el._comp;
  }

  function _unwrapCompStrict(el) {
    console.assert(el._comp, "Expecting a back-link to the component instance.");
    return _unwrapComp(el);
  }

  function notNull(n) { return n; }

  Component.unwrap = _unwrapComp;

};

DOMElement.Delegator.extend(Component);

DOMElement._defineProperties(Component,
  without(DOMElement._propertyNames,
    'addEventListener', 'removeEventListener',
    'insertBefore'
  )
);

/**
 * Adding a property which is providing an i18n service
 * which should be received via depency injection.
 */
I18n.mixin(Component);

Component.static.render = function(props) {
  props = props || {};
  var ComponentClass = this.__class__;
  var comp = new ComponentClass(null, props);
  comp.rerender();
  return comp;
};

Component.static.mount = function(props, el) {
  if (arguments.length === 1) {
    props = {};
    el = arguments[0];
  }
  if (isString(el)) {
    var selector = el;
    if (inBrowser) {
      el = window.document.querySelector(selector);
    } else {
      throw new Error("This selector is not supported on server side.");
    }
  }
  if (!el._isDOMElement) {
    el = new DefaultDOMElement.wrapNativeElement(el);
  }
  var ComponentClass = this.__class__;
  var comp = new ComponentClass(null, props);
  comp.mount(el);
  return comp;
};

Component.mount = function(ComponentClass, props, el) {
  if (arguments.length === 2) {
    props = {};
    el = arguments[1];
  }
  return ComponentClass.static.mount(props, el);
};

function ElementComponent(parent, virtualComp) {
  if (!parent._isComponent) {
    throw new Error("Illegal argument: 'parent' must be a Component.");
  }
  if (!virtualComp._isVirtualHTMLElement) {
    throw new Error("Illegal argument: 'virtualComp' must be a VirtualHTMLElement.");
  }
  this.parent = parent;
  // just take the reference of the parent context
  // so it can be passed through to child components
  this.context = parent.context;
}

ElementComponent.Prototype = function() {
  this._isElementComponent = true;
};

Component.extend(ElementComponent);
Component.Element = ElementComponent;

function TextNodeComponent(parent, virtualComp) {
  if (!parent._isComponent) {
    throw new Error("Illegal argument: 'parent' must be a Component.");
  }
  if (!virtualComp._isVirtualTextNode) {
    throw new Error("Illegal argument: 'virtualComp' must be a VirtualTextNode.");
  }
  this.parent = parent;
}

TextNodeComponent.Prototype = function() {
  this._isTextNodeComponent = true;

  this.setTextContent = function(text) {
    if (!this.el) {
      throw new Error('Component must be rendered first.');
    }
    if (this.el.textContent !== text) {
      var newEl = this.el.createTextNode(text);
      this.el._replaceNativeEl(newEl.getNativeElement());
    }
  };
};

Component.extend(TextNodeComponent);
Component.TextNode = TextNodeComponent;

module.exports = Component;
