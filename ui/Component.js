'use strict';

/* jshint latedef:nofunc */

var $ = require('../util/jquery');
var isFunction = require('lodash/lang/isFunction');
var isString = require('lodash/lang/isString');
var isFunction = require('lodash/lang/isFunction');
var isEqual = require('lodash/lang/isEqual');
var extend = require('lodash/object/extend');
var each = require('lodash/collection/each');
var I18n = require('./i18n');
var EventEmitter = require('../util/EventEmitter');
var DefaultDOMElement = require('./DefaultDOMElement');
var VirtualDOMElement = require('./VirtualDOMElement');
var VirtualTextNode = VirtualDOMElement.VirtualTextNode;

var __id__ = 0;
var _htmlParams;

var inBrowser = (typeof window !== 'undefined');

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
  @extends ui/DefaultDOMElement
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
function Component(parent, params) {
  EventEmitter.call(this);

  if (!parent && parent !== "root") {
    throw new Error("Contract: every component needs to have a parent.");
  }

  this.__id__ = __id__++;

  // will be set after first render
  this.$el = null;
  this.el = null;

  params = params || {};

  this.refs = {};
  // TODO: This is maybe not a good idea. If we want to do it, we could allow
  // ref (without the underscore) being passed but remove it from the params
  // afterwards so we don't pollute the props.
  this._ref = params._ref;

  this.parent = parent;
  // the children, private as they are managed by rendering
  // ATTENTION: while this is defined as '_children' we should never access it directly
  // so that we can override it via getChildren()
  this._children = [];

  // context from parent (dependency injection)
  this.context = this._getContext();

  this._isOnRoute = params._isOnRoute;
  if (parent === "root") {
    this._isOnRoute = true;
  }

  this._htmlParams = _htmlParams(params);
  this._setProps(params.props);

  this._setState(this._getInitialState());

  this.actionHandlers = {};

  this._data = {
    attributes: {},
    style: {},
    handlers: {},
    props: {},
    children: []
  };

  // This was originally called before _setState, but in the Writer we need
  // a hook after both props and state have been initialized,
  // so we can trigger state handlers for the initial state transition
  // before something is rendered actually
  if (this.didInitialize) {
    console.warn("Component.didInitialize() has been deprecated. Use Component.initialize() instead.");
    this.didInitialize(this.props, this.state);
  }

  this.initialize();
}

Component.Prototype = function ComponentPrototype() {

  extend(this, EventEmitter.prototype);

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

  this.initialize = function(props, state) {
    // jshint unused: false
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
    if (this.parent !== "root") {
      return this.parent;
    } else {
      return null;
    }
  };

  /**
    Render the component.

    ATTENTION: this does not create a DOM presentation but
    a virtual representation which is compiled into a DOM element later.

    Every Component should override this method.

    @abstract
    @return {VirtualNode} VirtualNode created using Component.$$
   */
  this.render = function() {
    // TODO: maybe we should force implementation by throwing?
    /* istanbul ignore next */
    return Component.$$('div');
  };

  /**
   * Determines if Component.rerender() should be run after
   * changing props or state.
   *
   * The default implementation performs a deep equal check.
   *
   * @return a boolean indicating whether rerender() should be run.
   */
  this.shouldRerender = function(newProps, newState) {
    /* jshint unused: false */
    return true;
  };

  /**
   * Rerenders the component.
   *
   * Call this to manually trigger a rerender.
   */
  this.rerender = function() {
    _pushOwner(this);
    var virtualEl = this.render();
    _popOwner();
    this._render(virtualEl);
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
  this.triggerDidMount = function(isMounted) {
    if (!isMounted) {
      isMounted = Component.isMounted(this);
    }

    // Check if actually mounted, otherwise we can skip
    if (isMounted) {
      // Trigger didMount for the children first
      this.children.forEach(function(child) {
        // We pass isMounted=true to save costly calls to Component.isMounted
        // for each child / grandchild
        child.triggerDidMount(true);
      });

      // To prevent from multiple calls to didRender, which can happen under
      // specific circumstances we use a guard.
      // See `test/unit/ui/Component.test.js` where didMount is tested
      if (!this.__didMountTriggered__) {
        this.didMount();
        this.__didMountTriggered__ = true;
      }
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
   * Removes this component from its parent.
   *
   * @chainable
   * @private
   */
  this.unmount = function() {
    this.triggerDispose();
    this.$el.remove();

    // Make sure that, if the component survives, on next mount, didMount will
    // be called.
    this.__didMountTriggered__ = false;
    // TODO: do we need to remove this from parents children right now it feels
    // like that it doesn't make a great difference because most often this
    // method is called by the parent duringrerendering and on other cases it
    // would be gone after the next parent rerender.
    return this;
  };

  /**
   * @return a boolean indicating if this component is mounted.
   */
  this.isMounted = function() {
    return Component.isMounted(this);
  };

  /**
   * Triggers dispose handlers recursively.
   *
   * @private
   */
  this.triggerDispose = function() {
    each(this.children, function(child) {
      child.triggerDispose();
    });
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
      if (comp.actionHandlers[action]) {
        comp.actionHandlers[action].apply(comp, Array.prototype.slice.call(arguments, 1));
        return true;
      }
      comp = comp.getParent();
    }
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
    }, this);
    return this;
  };

  this.actions = function(actions) {
    // Deprecated because I don't like how it reads
    // this.actions({ ... })
    // being a method but named like it was a property.
    console.log("DEPRECATED: Use 'this.handleActions(actions)' instead.");
    return this.handleActions(actions);
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
    this.actionHandlers[name] = handler;
  };

  /**
    Sets the state of this component, potentially leading to a rerender.

    Usually this is used by the component itself.
  */
  this.setState = function(newState) {
    var needRerender = this.shouldRerender(this.getProps(), newState);
    this.willUpdateState(newState);
    this._setState(newState);
    this.didUpdateState();

    // TODO: we need a better way, to inhibit recurrent updates
    // of the router after state updates by the router itself
    var router = this.context.router;
    if (router && router.isActive()) {
      router.truncateState(this);
    }

    if (needRerender) {
      this.rerender();
    }

    if (router && router.isActive()) {
      var routeState = getRouteState(this);
      if (routeState) {
        router.updateState(routeState);
      }
    }
  };

  // EXPERIMENTAL: routing implementation
  //
  // If a setState is called on a component which is on the route
  // i.e., has been rendered using $$.route()
  // then we extract the states of all components on the route
  // and send an action to the application which can then update the browsers URL.

  function getRouteState(target) {
    var states = [target.getState()];
    // app states are route states
    if (target.parent === "root") {
      return states;
    }
    if (!target._isOnRoute) {
      return false;
    }
    // collect all components and their state
    // on the route
    var comp = target.getParent();
    var lastOnRoute = target;
    while(comp && comp !== "root") {
      if (comp.route) {
        if (comp.route !== lastOnRoute) {
          console.error('Route is broken!');
          return false;
        }
        states.unshift(comp.getState());
        lastOnRoute = comp;
      }
      comp = comp.getParent();
    }
    return states;
  }

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
  this.willUpdateState = function(newState) {
    // jshint unused: false
  };

  /**
    Hook which is called after the state has updated.
  */
  this.didUpdateState = function() {};

  /**
    Sets the properties of this component, potentially leading to a rerender.

    @param {object} an object with properties
  */
  this.setProps = function(newProps) {
    var needRerender = this.shouldRerender(newProps, this.getState());
    this.willReceiveProps(newProps);
    this._setProps(newProps);
    if (needRerender) {
      this.rerender();
    }
    // Important to call this after rerender, so within the hook you can interact
    // with the updated DOM. However we still observe that sometimes the DOM is
    // not ready at that point.
    this.didReceiveProps();
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
  this.willReceiveProps = function(newProps) {
     // jshint unused: false
  };

  /**
    Hook which is called after properties have been set.
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

  this._getInitialState = function() {
    if (this.context.router) {
      var state = this.context.router.getInitialState(this);
      if (state) {
        return state;
      }
    }
    return this.getInitialState();
  };

  // ### ui/DOMElement API

  this.hasClass = function(className) {
    if (this.$el) {
      return this.$el.hasClass(className);
    }
    return false;
  };

  this.addClass = function(className) {
    this._data.addClass(className);
    if (this.$el) {
      this.$el.addClass(className);
    }
    return this;
  };

  this.removeClass = function(className) {
    this._data.removeClass(className);
    if (this.$el) {
      this.$el.removeClass(className);
    }
    return this;
  };

  this.removeAttr = function() {
    this._data.removeAttr.apply(this._data, arguments);
    if (this.$el) {
      this.$el.removeAttr.apply(this.$el, arguments);
    }
    return this;
  };

  this.getAttribute = function(name) {
    return this.$el.attr(name);
  };

  this.setAttribute = function(name, value) {
    this._data.attr(name, value);
    if (this.$el) {
      this.$el.attr(name, value);
    }
    return this;
  };

  this.setTagName = function() {
    throw new Error('Not supported.');
  };

  this.setId = function(id) {
    this._data.setId(id);
    this.el.id = id;
    return this;
  };

  this.getTextContent = function() {
    if (!this.$el) {
      return "";
    } else {
      return this.$el.text();
    }
  };

  this.setTextContent = function(text) {
    this.empty();
    this.append(text);
    return this;
  };

  this.getInnerHtml = function() {
    if (!this.$el) {
      return "";
    } else {
      return this.$el.html();
    }
  };

  this.setInnerHtml = function() {
    // not supported yet, as we don't know how to derive a virtual representation for
    // the given raw HTML
    throw new Error('Not supported.');
  };

  // TODO: get rid of it by reusing DefaultDOMElement as element impl
  this.getOuterHtml = function() {
    if (inBrowser) {
      return this.el.outerHTML;
    } else {
      // TODO: this seems a bit awkward, but with jQuery there is no better
      // way... maybe using low-level cheerio API?
      return $('<div>').append(this.$el.clone()).html();
    }
  };

  this.setValue = function(value) {
    this._data.val(value);
    if (this.$el) {
      this.$el.val(value);
    }
    return this;
  };

  /**
   * Get or set HTML properties analog to [jQuery.prop](http://api.jquery.com/prop).
   *
   * Note: we can't follow jquery's method name here, as it brings a semantical
   * conflict/confusion with the component's setProps API.
   * `$.prop` is used less often, thus it should be acceptable to deviate from jquery.
   * In fact, we have not used `$.prop` at all so far, as we haven't made use
   * of input fields and such where you have a lot of html properties.
   */
  this.htmlProp = function() {
    if (arguments.length === 1 && isString(arguments[0])) {
      return this.$el.prop(arguments[0]);
    } else {
      this._data.htmlProp.apply(this._data, arguments);
      if (this.$el) {
        this.$el.prop.apply(this.$el, arguments);
      }
      return this;
    }
  };

  /**
    Remove HTML properties analog to [jQuery.removeProp](http://api.jquery.com/removeProp/)
  */
  this.removeHtmlProp = function() {
    this._data.removeHtmlProp.apply(this._data, arguments);
    if (this.$el) {
      this.$el.removeProp.apply(this.$el, arguments);
    }
    return this;
  };

  this.setStyle = function(name, value) {
    this._data.setStyle(name, value);
    this.$el.css(name, value);
  };

  this.getChildNodes = function() {
    return this.children;
  };

  this.getChildren = function() {
    // TODO: this should return only real elements (i.e., without TextNodes and Comments)
    return this.children;
  };

  this.createElement = function() {
    throw new Error('Not supported yet.');
  };

  this.clone = function() {
    throw new Error('Not supported yet.');
  };

  this.is = function(cssSelector) {
    if (this.$el) {
      return this.$el.is(cssSelector);
    } else {
      throw new Error('Invalid state: you can use this after the component has been rendered.');
    }
    return false;
  };

  this.find = function(cssSelector) {
    /* jshint unused:false */
    throw new Error('Not supported.');
  };

  this.findAll = function(cssSelector) {
    /* jshint unused:false */
    throw new Error('Not supported.');
  };

  /**
   * Append a child component created using {@link ui/Component.$$}.
   *
   * Part of the incremental updating API.
   *
   * @param {ui/Component.VirtualNode} child the child component
   */
  this.append = function(child) {
    if (isString(child)) {
      child = new VirtualTextNode(child);
    }
    var comp = this._compileComponent(child);
    this._data.append(child);
    this.$el.append(comp.$el);
    this.children.push(comp);
    comp.triggerDidMount();
    return this;
  };

  /**
   * Insert a child component created using Component.$$ at a given position.
   *
   * Part of the incremental updating API.
   */
  this.insertAt = function(pos, child) {
    var comp = this._compileComponent(child);
    this._data.insertAt(pos, child);
    if (pos > this.children.length-1) {
      this.$el.append(comp.$el);
      this.children.push(comp);
    } else {
      comp.$el.insertBefore(this.children[pos].$el);
      this.children.splice(pos, 0, comp);
    }
    comp.triggerDidMount();
    return this;
  };

  /**
   * Remove(/unmount) the child component at a given position.
   *
   * Part of the incremental updating API.
   */
  this.removeAt = function(pos) {
    this._data.removeAt(pos);
    this.children[pos].unmount();
    this.children.splice(pos, 1);
    return this;
  };

  /**
   * Remove(/unmount) all child components.
   *
   * Part of the incremental updating API.
   */
  this.empty = function() {
    this._data._children = [];
    this.$el.empty();
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].unmount();
    }
    this.children = [];
    return this;
  };

  this.remove = function() {
    this.unmount();
  };

  /* Internal API */

  var _indexByRef = function(children) {
    var index = {};
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var ref = child._ref;
      if (ref) {
        index[ref] = child;
      }
    }
    return index;
  };

  this._createElement = function(data, scope) {
    var $el = $('<' + data._tagName + '>');
    // $.addClass
    $el.addClass(this._htmlParams.classNames);
    $el.addClass(data.classNames);
    // $.attr
    $el.attr(this._htmlParams.attributes);
    $el.attr(data.attributes);
    // $.prop
    $el.prop(this._htmlParams.htmlProps);
    $el.prop(data.htmlProps);
    // $.css
    $el.css(this._htmlParams.style);
    if(data.style) {
      $el.css(data.style);
    }
    // $.on
    each(data.handlers, function(handlerSpec, eventName) {
      this._bindHandler($el[0], scope, eventName, handlerSpec);
    }, this);
    return $el;
  };

  this._updateElement = function(data, oldData, scope) {
    var $el = this.$el;

    // TODO: we should make sure that html parameters given from
    // parent are preserved

    // $.addClass / $.removeClass
    var oldClassNames = oldData.classNames;
    var newClassNames = data.classNames;
    if (oldClassNames !== newClassNames) {
      $el.removeClass(oldClassNames);
      $el.addClass(newClassNames);
    }
    // $.attr / $.removeAttr
    var oldAttributes = oldData.attributes;
    var newAttributes = data.attributes;
    // TODO: this could be done more incrementally by using difference
    if (!isEqual(oldAttributes, newAttributes)) {
      var oldAttrNames = Object.keys(oldAttributes);
      $el.removeAttr(oldAttrNames.join(" "));
      $el.attr(newAttributes);
    }
    // $.prop / $.removeProp
    var oldHtmlProps = oldData.htmlProps;
    var newHtmlProps = data.htmlProps;
    // TODO: this could be done more incrementally by using difference
    if (!isEqual(oldHtmlProps, newHtmlProps)) {
      var oldPropNames = Object.keys(oldHtmlProps);
      $el.removeProp(oldPropNames.join(" "));
      $el.prop(newHtmlProps);
    }
    // $.css
    // css styles must be overwritten explicitly (there is no '$.removeCss')
    if (!isEqual(oldData.style, data.style)) {
      if (data.style) {
        $el.css(data.style);
      }
    }
    // $.on / $.off
    if (!isEqual(oldData.handlers, data.handlers)) {
      each(oldData.handlers, function(handler, eventName) {
        $el.off(eventName);
      });
      each(data.handlers, function(handlerSpec, eventName) {
        this._bindHandler($el[0], scope, eventName, handlerSpec);
      }, this);
    }
    return $el;
  };

  this._render = function(data, scope) {
    this.willRender();

    if (!data) {
      throw new Error('Nothing to render. Make sure your render method returns a virtual element: '+this.displayName);
    }

    if (data.type !== 'element') {
      if (data instanceof $) {
        throw new Error('Your render() method accidently return a jQuery instance instead of a VirtualComponent created $$.');
      }
      throw new Error("Component.render() must return one html element: e.g., $$('div')");
    }
    if (!scope) {
      scope = {
        owner: this,
        refs: {}
      };
    }
    var oldData = this._data;

    // the first time we need to create the component element
    // and can render from scratch
    if (!this.$el) {
      this.$el = this._createElement(data, scope);
      this.el = this.$el[0];
      this._renderFromScratch(data, scope);
      return;
    }

    // update the element
    this._updateElement(data, oldData, scope);

    // when during the last render there where no 'keys'
    // then we can just wipe and rerender
    if (Object.keys(this.refs).length === 0) {
      this._renderFromScratch(data, scope);
      return;
    }

    var el = this.$el[0];
    var isMounted = Component.isMounted(this);

    var oldContent = oldData._children;
    var newContent = data._children;

    // FIXME: this optimization is causing issue 311
    if (isEqual(oldContent, newContent)) {
      this._data = data;
      return;
    }

    var oldComps = _indexByRef(oldData._children, "old");
    var newComps = _indexByRef(data._children);

    var pos = 0;
    var oldPos = 0;
    var newPos = 0;

    var oldChildren = this.children;
    var children = [];

    function _replace(oldComp, newComp) {
      oldComp.triggerDispose();
      oldComp.$el.replaceWith(newComp.$el[0]);
    }

    function _update(comp, data) {
      // Note: when updating a HTML element we provide the same ref scope
      if (comp instanceof Component.Container) {
        comp._render(data, scope);
      } else {
        // HACK: propagating HTML element data and setting props (including lifecycle hooks)
        // is currently not available. This is ugly, and should be repaired.
        var htmlParams = _htmlParams(data);
        comp._updateElement(htmlParams, comp._htmlParams);
        comp._htmlParams = htmlParams;
        comp.setProps(data.props);
      }
    }

    // step through old and new content data (~virtual DOM)
    // and apply changes to the component element
    while(oldPos < oldContent.length || newPos < newContent.length) {
      var node = el.childNodes[pos];
      var _old = oldContent[oldPos];
      var _new = newContent[newPos];
      var comp = null;
      var oldComp = oldChildren[oldPos];

      // append remaining new components if there is no old one left
      if (!_old) {
        for (var i = newPos; i < newContent.length; i++) {
          comp = this._compileComponent(newContent[i], scope);
          this.$el.append(comp.$el);
          children.push(comp);
          comp.triggerDidMount(isMounted);
        }
        break;
      }
      // unmount remaining old components if there is no old one left
      if (!_new) {
        for (var j = oldPos; j < oldContent.length; j++) {
          oldChildren[j].unmount();
        }
        break;
      }

      // otherwise do a differential update
      if (node !== oldComp.$el[0]) {
        throw new Error('Assertion failed: DOM structure is not as expected.');
      }

      // Note: if the key property is set the component is treated preservatively
      var newRef = _new._ref;
      var oldRef = _old._ref;
      if (oldRef && newRef) {
        // the component is in the right place already
        if (oldRef === newRef) {
          // check if the two nodes are 'quasi' equal
          // i.e. having the same type and e.g. Component class
          if (_new._quasiEquals(_old)) {
            comp = oldComp;
            _update(comp, _new);
          } else {
            comp = this._compileComponent(_new, scope);
            _replace(oldComp, comp);
            comp.triggerDidMount(isMounted);
          }
          pos++; oldPos++; newPos++;
        }
        // a new component has been inserted
        else if (!oldComps[newRef] && newComps[oldRef]) {
          comp = this._compileComponent(_new, scope);
          comp.$el.insertBefore(node);
          comp.triggerDidMount(isMounted);
          pos++; newPos++;
        }
        // old component has been replaced
        else if (!oldComps[newRef] && !newComps[oldRef]) {
          comp = this._compileComponent(_new, scope);
          _replace(oldComp, comp);
          comp.triggerDidMount(isMounted);
          pos++; newPos++; oldPos++;
        }
        // a component has been removed
        else if (oldComps[newRef] && !newComps[oldRef]) {
          oldComp.unmount();
          oldPos++;
          // continueing as we did not insert a component
          continue;
        }
        // component has been moved to a different position
        else if (oldComps[newRef] && newComps[oldRef]) {
          throw new Error('Swapping positions of persisted components not supported!');
        }
        else {
          throw new Error('Assertion failed: should not reach this statement.');
        }
      } else if (newRef) {
        if (oldComps[newRef]) {
          oldComp.unmount();
          oldPos++;
          // continueing as we did not insert a component
          continue;
        }
        else {
          comp = this._compileComponent(_new, scope);
          _replace(oldComp, comp);
          comp.triggerDidMount(isMounted);
          pos++; oldPos++; newPos++;
        }
      } else if (oldRef) {
        comp = this._compileComponent(_new, scope);
        if (newComps[oldRef]) {
          comp.$el.insertBefore(node);
        } else {
          _replace(oldComp, comp);
          oldPos++;
        }
        comp.triggerDidMount(isMounted);
        pos++; newPos++;
      } else {
        // do not replace text components if they are equal
        if (_new.type === "text" && _old.type === "text" && _new.props.text === _old.props.text) {
          // skip
          comp = oldComp;
        } else {
          comp = this._compileComponent(_new, scope);
          _replace(oldComp, comp);
          comp.triggerDidMount(isMounted);
        }
        pos++; oldPos++; newPos++;
      }
      if (comp._ref) {
        var _data = comp._data;
        if (_data._owner) {
          _data._owner.refs[comp._ref] = comp;
        } else {
          console.warn('FIXME: owner is unknown.');
        }
      }
      if (comp._isOnRoute) {
        // TODO: probably this raises false alarms.
        if (scope.owner.route) {
          console.warn('Route is already defined in this scope. In every render() implementation there must be only one routed component.');
        }
        scope.owner.route = comp;
      }
      children.push(comp);
    }

    this.children = children;
    // this.refs = clone(scope.refs);
    this._data = data;

    this.didRender();
  };

  this._renderFromScratch = function(data, scope) {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].unmount();
    }
    // HACK: make sure that this el is really empty
    // FIXME: e.g. RawHtml we do not register as children
    this.$el.empty();
    var isMounted = Component.isMounted(this);
    var children = [];
    for (var j = 0; j < data._children.length; j++) {
      // EXPERIMENTAL: supporting $$.html()
      // basically it doesn't make sense to mix $$.html() with $$.append(), but...
      if (data._children[j] instanceof VirtualDOMElement.RawHtml) {
        this.$el.html(data._children[j].html);
        children = [];
      } else {
        var comp = this._compileComponent(data._children[j], scope);
        this.$el.append(comp.$el);
        children.push(comp);
        comp.triggerDidMount(isMounted);
      }
    }
    // this.refs = scope.refs;
    this.children = children;
    this._data = data;

    this.didRender();
  };

  this._compileComponent = function(data, scope) {
    return Component._render(data, { scope: scope, context: this });
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

  this._setProps = function(props) {
    this.props = props || {};
    // freezing state to 'enforce' immutability
    Object.freeze(this.props);
  };

  this._setState = function(state) {
    this.state = state || {};
    // freezing state to 'enforce' immutability
    Object.freeze(this.state);
  };

  this._bindHandler = function(nativeEl, scope, eventName, handlerSpec) {
    // console.log('Binding to', event, 'in', scope.owner);
    var handler = handlerSpec.handler;
    if (handlerSpec.context) {
      handler = handler.bind(handlerSpec.context);
    } else {
      handler = handler.bind(scope.owner);
    }
    if (handlerSpec.selector) {
      var _handler = handler;
      handler = function(event) {
        if ($(event.target).is(handlerSpec.selector)) {
          _handler(event);
        }
      };
    }
    nativeEl.addEventListener(eventName, handler);
  };
};

DefaultDOMElement.extend(Component);

Object.defineProperties(Component.prototype, {
  /**
    @property {Array<ui/DOMElement>} ui/DOMElement#children children elements
   */
  'children': {
    get: function() {
      return this._children;
    },
    set: function(children) {
      this._children = children;
    }
  },
});


/**
 * Adding a property which is providing an i18n service
 * which should be received via depency injection.
 */
I18n.mixin(Component);

_htmlParams = function(data) {
  return {
    classNames: data.classNames || "",
    attributes: data.attributes || {},
    htmlProps: data.htmlProps || {},
    style: data.style || {},
  };
};

/* Built-in components */

Component.Root = function(params) {
  Component.call(this, "root", params);
};
Component.extend(Component.Root);

Component.Container = function(parent, params) {
  Component.call(this, parent, params);
};
Component.extend(Component.Container);

Component.HTMLElement = function(parent, tagName, params) {
  this._tagName = tagName;
  Component.Container.call(this, parent, params);
};

Component.Container.extend(Component.HTMLElement);

Component.Text = function(parent, text) {
  Component.call(this, parent);
  this._text = text;
};
Component.Text.Prototype = function() {
  this._render = function() {
    if (!this.$el) {
      if (inBrowser) {
        this.el = window.document.createTextNode(this._text);
      } else {
        // HACK: using custom factory method for cheerio's native text node
        this.el = $._createTextNode(this._text);
      }
      this.$el = $(this.el);
    } else {
      this.$el.text(this._text);
    }
  };
};
Component.extend(Component.Text);

/*
Note: Component.createElement() should be used from within a Component#render()
      only.

      This is important to be able to implement refs and handlers correctly.
      Both, are bound to the owner, which is the Component instance of the last
      entered render method.
*/

var _currentOwner = null;
var _ownerStack = [];

function _pushOwner(owner) {
  _currentOwner = owner;
  _ownerStack.push(owner);
}

function _popOwner() {
  _currentOwner = _ownerStack.pop();
}

Component.createElement = function() {
  if (!_currentOwner) {
    throw new Error('Component.createElement can not be used outside of the Component rendering lifecycle.');
  }
  var el = VirtualDOMElement.createElement.apply(null, arguments);
  el._owner = _currentOwner;
  return el;
};

// only for legacy
Component.$$ = Component.createElement;

/*
  Internal implementation, rendering a virtual component
  created using the $$ operator.

  Don't us it. You should use `Component.mount()` instead.

  @private
*/
Component._render = function(data, options) {
  var component;
  options = options || {};
  var scope = options.scope || {
    context: null,
    refs: {}
  };
  var parent = options.context || "root";
  switch(data.type) {
    case 'text':
      component = new Component.Text(parent, data.props.text);
      component._render();
      break;
    case 'element':
      component = new Component.HTMLElement(parent, data._tagName, data);
      component._render(data, scope);
      break;
    case 'component':
      component = new data.ComponentClass(parent, data);
      _pushOwner(component);
      var virtualEl = component.render();
      _popOwner();
      component._render(virtualEl);
      break;
    case 'html':
      // DON'T mix $$.html() with $$.append()
      throw new Error('$$.html() can not be used in combination with other composition methods.');
    default:
      throw new Error('Unsupported component type: ' + data.type);
  }
  if (data._ref) {
    if (data._owner) {
      data._owner.refs[data._ref] = component;
    } else {
      console.warn('FIXME: owner is unknown.');
    }
    // scope.refs[data._ref] = component;
  }
  if (data._isOnRoute) {
    // TODO: probably I have to make sure that the route cleared before
    // rerendering, so that this check does not give a false alarm
    if (scope.owner.route) {
      console.warn('Route is already defined in this scope. Only one route is allowed in each render() implementation.');
    }
    scope.owner.route = component;
  }
  return component;
};

/**
  @param {Class|Function} ComponentClass a Component class or a render function
  @param {Object} [props]
  @returns {Component}

  @example

  Creating an instace of a Component:

  ```
  var comp = Component.render(MyComponent)
  ```

  Creating an anonymous Component class via a render function.
  This is used mostly internally, e.g., in the test suite.

  ```
  var comp = Component.render(function() {
    return $$('div').append('foo')
  })
  ```
*/
Component.render = function(component, props) {
  props = props || {};
  if (isFunction(component)) {
    var ComponentClass = component;
    if (!(ComponentClass.prototype instanceof Component)) {
      ComponentClass = function AnonymousComponent() {
        Component.apply(this, arguments);
      };
      Component.extend(ComponentClass, {
       render : component
      });
    }
    component = new ComponentClass("root", { props: props });
    _pushOwner(component);
    var virtualEl = component.render();
    _popOwner();
    component._render(virtualEl);
  } else {
    throw new Error('Unsupported arguments for Component.render');
  }
  return component;
};

/**
  Mount a component onto a given DOM or jquery element.

  Mounting a component means, that the component gets rendered
  and then appended to the given element.
  If the element is in the DOM, all components receive a 'didMount' event.

  @param {Class} component Component Class to be mounted
  @param {Object} [props] props for the component
  @param el a DOM or jQuery element
  @return {Component} the mounted component

  @example

  Mounting a component via Component class and providing props.

  ```
  Component.mount(MyComponent, { foo: "foo" }, $('body'));
  ```

  Creating a component using `Component.render()` and mounting later:

  ```
  var comp = Component.render(MyComponent);
  comp.addClass('foo');
  Component.mount(comp, $('body'));
  ```

*/
Component.mount = function(component, props, el) {
  if (arguments.length === 2) {
    el = arguments[1];
    props = {};
  }
  if (component instanceof Component) {
    // nothing to do
  } else if (component instanceof VirtualDOMElement) {
    // mounting a virtual element is not recommended
    // because we can't support 'refs' without having a 'render()' context
    console.warn('DEPRECATED: use Component.mount(MyComponent, {...}, el) instead.');
    component = Component._render(component);
  } else if (arguments[0].prototype instanceof Component) {
    component = Component.render(component, props);
  } else {
    throw new Error('component must be of type Component or VirtualComponent');
  }
  if (!el) throw new Error('An element is needed for mounting.');
  $(el).append(component.$el);
  component.triggerDidMount();
  return component;
};

/**
  Checks whether a given element has been injected in the document already

  We traverse up the DOM until we find the document root element. We return true
  if we can find it.
*/

Component.isMounted = function(comp) {
  var el;

  // Not rendered yet, so can not be mounted
  if (!comp.$el) return false;

  el = comp.$el[0];
  while(el) {
    // Node.DOCUMENT_NODE = 9;
    if (el.nodeType === 9) {
      return true;
    }
    el = el.parentNode;
  }
  return false;
};

module.exports = Component;
