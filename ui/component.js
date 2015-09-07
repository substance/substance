'use strict';

var OO = require('../basics/oo');
var _ = require('../basics/helpers');

var __id__ = 0;
var _isDocumentElement;
var _isInDocument;
var VirtualTextNode;
var RawHtml;

/**
 * A light-weight component implementation inspired by React and Ember.
 * In contrast to the large frameworks it does much less things automagically
 * in favour of a simple and synchronous life-cyle.
 *
 * Features:
 * - light-weight but simplified rerendering
 * - minimalistic life-cycle with hooks
 * - up-tree communication (send action)
 * - dependency injection
 *
 * ## Concepts
 *
 * ### `props`
 *
 * Props are provided by a parent component. There is a set of built-in properties,
 * such as `data` attributes or `classNames`.
 * An initial set of properties is provided via constructor. After that, the parent
 * component can call `setProps` to update these properties which triggers rerendering if the properties
 * change.
 *
 * ### `state`
 *
 * The component state is a set of flags and values which are used to control how the component
 * gets rendered give the current props.
 * Using `setState` the component can change its internal state, which leads to a rerendering if the state
 * changes.
 *
 * ### The `key` property
 *
 * A child component with a `key` id will be reused on rerender. All others will be wiped and rerender from scratch.
 * If you want to preserve a grand-child (or lower), then make sure that all anchestors have a key id.
 * After rendering the child will be accessible via `this.refs[key]`.
 *
 * ### Actions
 *
 * A component can send actions via `send` which are bubbled up through all parent components
 * until one handles it.
 * To register an action handler, a component must register like this
 * ```
 *   this.actions({
 *     "open-modal": this.openModal,
 *     "close-modal": this.closeModal
 *   });
 * ```
 * which is typically done in the constructor.
 */
function Component(parent, params) {
  if (!parent && parent !== "root") {
    throw new Error("Contract: every component needs to have a parent.");
  }

  this.__id__ = __id__++;
  params = params || {};

  this.refs = {};

  this.parent = parent;
  this.children = [];

  // get context from parent (dependency injection)
  this.context = this._getContext();

  this._key = params._key;
  this._htmlProps = {
    classNames: params.classNames || "",
    attributes: params.attributes || {},
    style: params.style || {},
  };
  this._setProps(params.props);

  /* istanbul ignore if */
  if (this.initialize) {
    console.warn("Component.initialize() has been deprecated. Use Component.didInitialize() instead.");
    this.initialize();
  }
  this.didInitialize();

  this._setState(this.getInitialState());

  this.actionHandlers = {};

  this._data = {
    attributes: {},
    style: {},
    handlers: {},
    props: {},
    children: []
  };
}

Component.Prototype = function ComponentPrototype() {

  /**
   * Provides the context which is delivered to every child component.
   *
   * @return object the child context
   */
  this.getChildContext = function() {
    return this.childContext || {};
  };

  /**
   * Hook which is called after the component has been initialized.
   */
  this.didInitialize = function() {};

  /**
   * Provide the initial component state.
   *
   * @return object the initial state
   */
  this.getInitialState = function() {
    return {};
  };

  /**
   * Provides the parent of this component.
   *
   * @return object the parent component or "root" if this component does not have a parent.
   */
  this.getParent = function() {
    return this.parent;
  };

  /**
   * Render the component.
   *
   * ATTENTION: this does not create a DOM presentation but
   * a virtual representation which is compiled into a DOM element later.
   *
   * Every Component should override this method.
   *
   * @return one VirtualNode created using Component.$$
   */
  this.render = function() {
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
    return !_.isEqual(newProps, this.props) || !_.isEqual(newState, this.state);
  };

  /**
   * Rerenders the component.
   *
   * Call this to manually trigger a rerender.
   */
  this.rerender = function() {
    this._render(this.render());
  };

  /**
   * Renders and appends this component to a given element.
   *
   * If the element is in the DOM already, triggers `component.didMount()`
   * on this component and all of its children.
   *
   * @chainable
   */
  this.mount = function($el) {
    this._render(this.render());
    $el.append(this.$el);
    // trigger didMount automatically if the given element is already in the DOM
    if (_isInDocument($el[0])) {
      this.triggerDidMount();
    }
    return this;
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
   * @example
   * ```
   * var frag = document.createDocumentFragment();
   * var component = new MyComponent();
   * component.mount(frag);
   * ...
   * $('body').append(frag);
   * component.triggerDidMount();
   * ```
   */
  this.triggerDidMount = function() {
    this.didMount();
    _.each(this.children, function(child) {
      child.triggerDidMount();
    });
  };

  /**
   * Called when the element is inserted into the DOM.
   *
   * Node: make sure that you call `component.mount(el)` using an element
   * which is already in the DOM.
   *
   * @example
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
   */
  this.unmount = function() {
    this.triggerWillUnmount();
    this.$el.remove();
    // TODO: do we need to remove this from parents children
    // right now it feels like that it doesn't make a great difference
    // because most often this method is called by the parent during rerendering
    // and on other cases it would be gone after the next parent rerender.
    return this;
  };

  /**
   * @return a boolean indicating if this component is mounted.
   */
  this.isMounted = function() {
    if (this.$el) {
      return _isInDocument(this.$el[0]);
    }
    return false;
  };

  /**
   * Triggers willUnmount handlers recursively.
   */
  this.triggerWillUnmount = function() {
    _.each(this.children, function(child) {
      child.triggerWillUnmount();
    });
    this.willUnmount();
  };

  /**
   * A hook which is called when the component is unmounted, i.e. removed from DOM.
   */
  this.willUnmount = function() {};

  /**
   * Send an action request to the parent component, bubbling up the component
   * hierarchy until an action handler is found.
   * @param action the name of the action
   * @param ... arbitrary number of arguments
   */
  this.send = function(action) {
    var comp = this;
    while(comp) {
      if (comp.actionHandlers[action]) {
        return comp.actionHandlers[action].apply(comp, Array.prototype.slice.call(arguments, 1));
      }
      comp = comp.getParent();
    }
    throw new Error('No component handled action: ' + action);
  };

  /**
   * Define action handlers.
   *
   * Call this during construction/initialization of a component.
   *
   * @example
   * ```
   * function MyComponent() {
   *   Component.apply(this, arguments);
   *   ...
   *   this.actions({
   *     "foo": this.handleFoo
   *   });
   * }
   * ```
   */
  this.actions = function(actions) {
    _.each(actions, function(method, action) {
      var handler = method.bind(this);
      this.actionHandlers[action] = handler;
    }, this);
  };

  /**
   * Sets the state of this component, potentially leading to a rerender.
   *
   * Usually this is used by the component itself.
   */
  this.setState = function(newState) {
    var needRerender = this.shouldRerender(this.getProps(), newState);
    this.willUpdateState(newState);
    this._setState(newState);
    this.didUpdateState();
    if (needRerender) {
      this.rerender();
    }
  };

  /**
   * This is similar to `setState()` but does not replace the state.
   *
   * @param newState an object with a partial update.
   */
  this.extendState = function(newState) {
    newState = _.extend({}, this.state, newState);
    this.setState(newState);
  };

  /**
   * @return the current state
   */
  this.getState = function() {
    return this.state;
  };

  /**
   * Hook which is called before the state is changed.
   *
   * Use this to dispose objects which will be replaced during state change.
   */
  this.willUpdateState = function(newState) {
    /* jshint unused: false */
  };

  /**
   * Hook which is called after the state is changed.
   */
  this.didUpdateState = function() {};

  /**
   * Sets the properties of this component, potentially leading to a rerender.
   *
   * @param an object with properties
   */
  this.setProps = function(newProps) {
    var needRerender = this.shouldRerender(newProps, this.getState());
    this.willReceiveProps(newProps);
    this._setProps(newProps);
    this.didReceiveProps();
    if (needRerender) {
      this.rerender();
    }
  };

  this.extendProps = function(updatedProps) {
    var newProps = _.extend({}, this.props, updatedProps);
    this.setProps(newProps);
  };

  /**
   * @return the current properties
   */
  this.getProps = function() {
    return this.props;
  };

  /**
   * Hook which is called before properties are updated.
   *
   * Use this to dispose objects which will be replaced when properties change.
   */
  this.willReceiveProps = function(newProps) {
    /* jshint unused: false */
  };

  /**
   * Hook which is called after properties have been set.
   */
  this.didReceiveProps = function() {};

  /**
   * Hook which is called after properties have been set.
   */
  this.didRender = function() {};

  /* API for incremental updates */

  /**
   * Add a class.
   *
   * Part of the incremental updating API.
   */
  this.addClass = function(className) {
    this._data.addClass(className);
    if (this.$el) {
      this.$el.addClass(className);
    }
    return this;
  };

  /**
   * Remove a class.
   *
   * Part of the incremental updating API.
   */
  this.removeClass = function(className) {
    this._data.removeClass(className);
    if (this.$el) {
      this.$el.removeClass(className);
    }
    return this;
  };

  /**
   * Toggle a class.
   *
   * Part of the incremental updating API.
   */
  this.toggleClass = function(className) {
    this._data.toggleClass(className);
    if (this.$el) {
      this.$el.toggleClass(className);
    }
    return this;
  };

  /**
   * Add a attributes.
   *
   * Part of the incremental updating API.
   */
  this.attr = function() {
    this._data.attr.apply(this._data, arguments);
    if (this.$el) {
      this.$el.attr.apply(this.$el, arguments);
    }
    return this;
  };

  /**
   * Remove an attribute.
   *
   * Part of the incremental updating API.
   */
  this.removeAttr = function() {
    this._data.removeAttr.apply(this._data, arguments);
    if (this.$el) {
      this.$el.removeAttr.apply(this.$el, arguments);
    }
    return this;
  };

  /**
   * Add css styles.
   *
   * Part of the incremental updating API.
   */
  this.css = function(style) {
    if (arguments.length === 2) {
      this._data.css(arguments[0], arguments[1]);
      this.$el.css(arguments[0], arguments[1]);
    } else if (style) {
      this._data.css(style);
      this.$el.css(style);
    }
    return this;
  };

  /**
   * Append a child component created using Component.$$.
   *
   * Part of the incremental updating API.
   */
  this.append = function(child) {
    var isMounted = this.isMounted();
    var comp = this._compileComponent(child, {
      refs: this.refs
    });
    this._data.append(child);
    if (isMounted) comp.triggerDidMount();
    this.$el.append(comp.$el);
    this.children.push(comp);
    return this;
  };

  /**
   * Insert a child component created using Component.$$ at a given position.
   *
   * Part of the incremental updating API.
   */
  this.insertAt = function(pos, child) {
    var isMounted = this.isMounted();
    var comp = this._compileComponent(child, {
      refs: this.refs
    });
    this._data.insertAt(pos, child);
    if (isMounted) comp.triggerDidMount();
    comp.$el.insertBefore(this.children[pos].$el);
    this.children.splice(pos, 0, comp);
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
    return this;
  };

  /**
   * Remove(/unmount) all child components.
   *
   * Part of the incremental updating API.
   */
  this.empty = function() {
    this._data.children = [];
    this.$el.empty();
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].unmount();
    }
    return this;
  };

  /* Internal API */

  var _indexByKey = function(children) {
    var index = {};
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var key = child._key;
      if (key) {
        index[key] = child;
      }
    }
    return index;
  };

  this._createElement = function(data, scope) {
    var $el = $('<' + data.tagName + '>');
    $el.addClass(this._htmlProps.classNames);
    $el.addClass(data.classNames);
    $el.attr(this._htmlProps.attributes);
    $el.attr(data.attributes);
    $el.css(this._htmlProps.style);
    if(data.style) {
      $el.css(data.style);
    }
    _.each(data.handlers, function(handler, event) {
      // console.log('Binding to', event, 'in', scope.owner);
      $el.on(event, handler.bind(scope.owner));
    }, this);
    return $el;
  };

  this._updateElement = function(data, oldData, scope) {
    var $el = this.$el;
    var oldClassNames = oldData.classNames;
    var newClassNames = data.classNames;
    if (oldClassNames !== newClassNames) {
      $el.removeClass(oldClassNames);
      $el.addClass(newClassNames);
    }
    var oldAttributes = oldData.attributes;
    var newAttributes = data.attributes;
    // TODO: this could be done more incrementally by using difference
    if (!_.isEqual(oldAttributes, newAttributes)) {
      var oldAttrNames = Object.keys(oldAttributes);
      $el.removeAttr(oldAttrNames.join(" "));
      $el.attr(newAttributes);
    }
    // css styles must be overwritten explicitly (there is no '$.removeCss')
    if (!_.isEqual(oldData.style, data.style)) {
      if (data.style) {
        $el.css(data.style);
      }
    }
    if (!_.isEqual(oldData.handlers, data.handlers)) {
      _.each(oldData.handlers, function(handler, event) {
        $el.off(event);
      });
      _.each(data.handlers, function(handler, event) {
        $el.on(event, handler.bind(scope.owner));
      }, this);
    }
    return $el;
  };

  this._render = function(data, scope) {
    if (data.type !== 'element') {
      if (data instanceof $) {
        throw new Error("Your render() method accidently return a jQuery instance instead of a VirtualComponent created $$.");
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
      this._renderFromScratch(data, scope);
      return;
    }

    // update the element
    this._updateElement(data, oldData, scope);

    // when during the last render there where no 'keys'
    // then we can just wipe and rerender
    if (this._no_refs_) {
      this._renderFromScratch(data, scope);
      return;
    }

    var el = this.$el[0];
    var isMounted = _isInDocument(el);

    var oldContent = oldData.children;
    var newContent = data.children;

    if (_.isEqual(oldContent, newContent)) {
      // console.log('-----');
      this._data = data;
      return;
    }

    var oldComps = _indexByKey(oldData.children, "old");
    var newComps = _indexByKey(data.children);

    var pos = 0;
    var oldPos = 0;
    var newPos = 0;

    var oldChildren = this.children;
    var children = [];

    function _replace(oldComp, newComp) {
      oldComp.triggerWillUnmount();
      oldComp.$el.replaceWith(newComp.$el[0]);
    }

    function _update(comp, data) {
      if (comp instanceof Component.Container) {
        comp._render(data);
      } else {
        // TODO: we probably need to propagate updates for attr, style, handlers, too
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
          if (isMounted) comp.triggerDidMount();
          this.$el.append(comp.$el);
          children.push(comp);
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
      var newKey = _new._key;
      var oldKey = _old._key;
      if (oldKey && newKey) {
        // the component is in the right place already
        if (oldKey === newKey) {
          comp = oldComp;
          _update(comp, _new);
          pos++; oldPos++; newPos++;
        }
        // a new component has been inserted
        else if (!oldComps[newKey] && newComps[oldKey]) {
          comp = this._compileComponent(_new, scope);
          comp.$el.insertBefore(node);
          if (isMounted) comp.triggerDidMount();
          pos++; newPos++;
        }
        // old component has been replaced
        else if (!oldComps[newKey] && !newComps[oldKey]) {
          comp = this._compileComponent(_new, scope);
          _replace(oldComp, comp);
          if (isMounted) comp.triggerDidMount();
          pos++; newPos++; oldPos++;
        }
        // a component has been removed
        else if (oldComps[newKey] && !newComps[oldKey]) {
          oldComp.unmount();
          oldPos++;
          // continueing as we did not insert a component
          continue;
        }
        // component has been moved to a different position
        else if (oldComps[newKey] && newComps[oldKey]) {
          throw new Error('Swapping positions of persisted components not supported!');
        }
        else {
          throw new Error('Assertion failed: should not reach this statement.');
        }
      } else if (newKey) {
        if (oldComps[newKey]) {
          oldComp.unmount();
          oldPos++;
          // continueing as we did not insert a component
          continue;
        }
        else {
          comp = this._compileComponent(_new, scope);
          _replace(oldComp, comp);
          if (isMounted) comp.triggerDidMount();
          pos++; oldPos++; newPos++;
        }
      } else if (oldKey) {
        comp = this._compileComponent(_new, scope);
        if (newComps[oldKey]) {
          comp.$el.insertBefore(node);
        } else {
          _replace(oldComp, comp);
          oldPos++;
        }
        if (isMounted) comp.triggerDidMount();
        pos++; newPos++;
      } else {
        // do not replace text components if they are equal
        if (_new.type === "text" && _old.type === "text" && _new.props.text === _old.props.text) {
          // skip
          comp = oldComp;
        } else {
          comp = this._compileComponent(_new, scope);
          _replace(oldComp, comp);
          if (isMounted) comp.triggerDidMount();
        }
        pos++; oldPos++; newPos++;
      }
      if (comp._key) {
        scope.refs[comp._key] = comp;
      }
      children.push(comp);
    }

    if (Object.keys(scope.refs).length > 0) {
      delete this._no_refs_;
    } else {
      this._no_refs_ = true;
    }

    this.children = children;
    this.refs = _.clone(scope.refs);
    this._data = data;

    this.didRender();
  };

  this._renderFromScratch = function(data, scope) {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].unmount();
    }
    var isMounted = _isInDocument(this.$el[0]);
    var children = [];
    for (var j = 0; j < data.children.length; j++) {
      // EXPERIMENTAL: supporting $$.html()
      // basically it doesn't make sense to mix $$.html() with $$.append(), but...
      if (data.children[j] instanceof RawHtml) {
        this.$el.html(data.children[j].html);
        children = [];
      } else {
        var comp = this._compileComponent(data.children[j], scope);
        if (isMounted) comp.triggerDidMount();
        this.$el.append(comp.$el);
        children.push(comp);
      }
    }
    if (Object.keys(scope.refs).length > 0) {
      delete this._no_refs_;
    } else {
      this._no_refs_ = true;
    }
    this.refs = scope.refs;
    this.children = children;
    this._data = data;

    this.didRender();
  };

  this._compileComponent = function(data, scope) {
    return Component._render(data, { scope: scope, context: this });
  };

  this._getContext = function() {
    var parent = this.getParent();
    var parentContext = parent.context || {};
    if (parent.getChildContext) {
      return _.extend(parentContext, parent.getChildContext());
    } else {
      return parentContext;
    }
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

};

OO.initClass(Component);

/* Built-in components */

Component.Root = function(params) {
  Component.call(this, "root", params);
};
OO.inherit(Component.Root, Component);

Component.Container = function(parent, params) {
  Component.call(this, parent, params);
};
Component.Container.Prototype = function() {
};
OO.inherit(Component.Container, Component);

Component.HtmlElement = function(parent, tagName, params) {
  this.tagName = tagName;
  Component.Container.call(this, parent, params);
};

OO.inherit(Component.HtmlElement, Component.Container);

Component.Text = function(parent, text) {
  Component.call(this, parent);
  this.text = text;
};

Component.Text.Prototype = function() {
  this._render = function() {
    if (!this.$el) {
      var el = document.createTextNode(this.text);
      this.$el = $(el);
    } else {
      this.$el[0].textContent = this.text;
    }
  };
};

OO.inherit(Component.Text, Component);

/* Virtual Components */

function VirtualNode() {
  this.attributes = {};
  this.style = {};
  this.handlers = {};
  this.props = {};
  this.children = [];
}

VirtualNode.Prototype = function() {
  this.key = function(key) {
    this._key = key;
    return this;
  };
  this.append = function(/* ...children */) {
    if (this.type === "component") {
      // As a custom component does have a render method, it is not clear
      // how an appended child should be treated.
      // Thus, we decided to deprecate this.
      // Instead you should use the properties to provide children and render them explicitly.
      // Example:
      // $$(MyComponent, { children: [...] });
      // ...
      // render: function() {
      //   ...
      //   someEl.append(this.props.children);
      //   ...
      // }
      console.error('DEPRECATED: Appending elements to custom components is not recommended. Provide children as properties and render them explicitly.');
    }
    var children;
    var _children = this._getChildren();
    if (arguments.length === 1) {
      var child = arguments[0];
      if (!child) {
        return this;
      }
      if (_.isArray(child)) {
        children = child;
        Component.$$.prepareChildren(children);
        Array.prototype.push.apply(_children, children);
      } else if (_.isString(child)) {
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
  this._getChildren = function() {
    return this.children;
  };
  this.insertAt = function(pos, child) {
    this.children.splice(pos, 0, child);
    return this;
  };
  this.removeAt = function(pos) {
    this.children.splice(pos, 1);
    return this;
  };
  this.addClass = function(className) {
    if (!this.classNames) {
      this.classNames = "";
    }
    this.classNames += " " + className;
    return this;
  };
  this.removeClass = function(className) {
    var classes = this.classNames.split(/\s+/);
    classes = _.without(classes, className);
    this.classNames = classes.join(' ');
    return this;
  };
  this.toggleClass = function(className) {
    var classes = this.classNames.split(/\s+/);
    if (classes.indexOf(className) >= 0) {
      classes = _.without(classes, className);
    } else {
      classes.push(className);
    }
    this.classNames = classes.join(' ');
    return this;
  };
  this.addProps = function(props) {
    _.extend(this.props, props);
    return this;
  };
  this.setProps = function(props) {
    this.props = props;
    return this;
  };
  this.extendProps = function(props) {
    _.extend(this.props, props);
    return this;
  };
  this.attr = function(attr) {
    if (arguments.length === 2) {
      this.attributes[arguments[0]] = arguments[1];
    } else {
      // TODO we could treat HTML attributes as special props
      // then we do need to fish attributes from custom props
      _.extend(this.attributes, attr);
    }
    return this;
  };
  this.removeAttr = function(attr) {
    if (_.isString(attr)) {
      delete this.attributes[attr];
    } else {
      this.attributes = _.omit(this.attributes, attr);
    }
    return this;
  };
  this.on = function(event, handler) {
    if (arguments.length !== 2 || !_.isString(event) || !_.isFunction(handler)) {
      throw new Error('Illegal arguments for $$.on(event, handler).');
    }
    this.handlers[event] = handler;
    return this;
  };
  this.css = function(style) {
    if (!this.style) {
      this.style = {};
    }
    if (arguments.length === 2) {
      this.style[arguments[0]] = arguments[1];
    } else {
      _.extend(this.style, style);
    }
    return this;
  };
  this.html = function(rawHtmlString) {
    this.children = [];
    this.children.push(new RawHtml(rawHtmlString));
    return this;
  };

  this._render = function() {
    return Component._render(this);
  };
};

OO.initClass(VirtualNode);

function VirtualElement(tagName) {
  VirtualNode.call(this);
  this.type = 'element';
  this.tagName = tagName;
}
OO.inherit(VirtualElement, VirtualNode);

function VirtualComponent(ComponentClass) {
  VirtualNode.call(this);
  this.type = 'component';
  this.ComponentClass = ComponentClass;
}
VirtualComponent.Prototype = function() {
  // Note: for VirtualComponents we put children into props
  // so that the render method of ComponentClass can place it.
  this._getChildren = function() {
    if (!this.props.children) {
      this.props.children = [];
    }
    return this.props.children;
  };
};
OO.inherit(VirtualComponent, VirtualNode);

VirtualTextNode = function VirtualTextNode(text) {
  VirtualNode.call(this);
  this.type = 'text';
  this.props = { text: text };
};

RawHtml = function RawHtml(html) {
  this.type = 'html';
  this.html = html;
};

/**
 * Create a virtual DOM representation which is used by Component
 * for differential/reactive rendering.
 *
 * @param arg1 HTML tag name or Component class
 * @param arg2 a properties object (optional)
 * @return a virtual DOM
 */
Component.$$ = function() {
  var content = null;
  if (_.isString(arguments[0])) {
    if (arguments.length !== 1) {
      throw new Error('Illegal usage of Component.$$.');
    }
    content = new VirtualElement(arguments[0]);
  } else if (_.isFunction(arguments[0]) && arguments[0].prototype instanceof Component) {
    if (arguments.length < 1 || arguments.length > 2) {
      throw new Error('Illegal usage of Component.$$.');
    }
    content = new VirtualComponent(arguments[0]);
    // EXPERIMENTAL: to reduce boilerplate, we want to allow to specifiy props as 2nd argument of $$
    if (arguments.length === 2) {
      content.addProps(arguments[1]);
    }
  } else {
    throw new Error('Illegal usage of Component.$$.');
  }
  return content;
};

Component.$$.prepareChildren = function(children) {
  for (var i = 0; i < children.length; i++) {
    if(_.isString(children[i])) {
      children[i] = new VirtualTextNode(children[i]);
    }
  }
};

_isDocumentElement = function(el) {
  // Node.DOCUMENT_NODE = 9
  return (el.nodeType === 9);
};

_isInDocument = function(el) {
  while(el) {
    if (_isDocumentElement(el)) {
      return true;
    }
    el = el.parentNode;
  }
  return false;
};

/**
 * Internal implementation, rendering a virtual component
 * created using the $$ operator.
 *
 * Don't us it. You should use `Component.mount()` instead.
 *
 * @example
 *
 * ```
 * Component.mount($$(MyComponent), $('body'));
 * ```
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
      component = new Component.HtmlElement(parent, data.tagName, data);
      component._render(data, scope);
      break;
    case 'component':
      component = new data.ComponentClass(parent, data);
      // TODO: we have a problem here: basically this is the place
      // where we descend into a child component implementation.
      // The component's render implementation would expect e.g. that handlers are
      // bound to it, and also refs created within that component.
      // However, it is also possible to provide children via append,
      // in the parent component's render method. Those handlers should be bound
      // to the parent. The same for refs.
      // To solve this, $$ would need to be contextified, which is quite ugly to achieve.
      component._render(component.render());
      break;
    case 'html':
      // DON'T mix $$.html() with $$.append()
      throw new Error('$$.html() can not be used in combination with other composition methods.');
    default:
      throw new Error('Unsupported component type: ' + data.type);
  }
  if (data._key) {
    scope.refs[data._key] = component;
  }
  return component;
};

/**
 * Mount a component onto a given jquery element.
 *
 * Mounting a component means, that the component gets rendered
 * and then appended to the given element.
 * If the element is in the DOM, all components receive an 'didMount' event.
 *
 * @param $el a jquery selected element
 * @return the mounted component.
 */
Component.mount = function(data, $el) {
  var component = Component._render(data);
  // TODO: some code replication of Component.prototype.mount()
  // however, we do not want to rerender right-away
  $el.append(component.$el);
  if (_isInDocument($el[0])) {
    component.triggerDidMount();
  }
  return component;
};

Component.VirtualTextNode = VirtualTextNode;

module.exports = Component;
