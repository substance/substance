import isString from 'lodash/isString'
import isFunction from 'lodash/isFunction'
import extend from 'lodash/extend'
import each from 'lodash/each'
import EventEmitter from '../util/EventEmitter'
import RenderingEngine from './RenderingEngine'
import VirtualElement from './VirtualElement'
import DOMElement from './DOMElement'
import DefaultDOMElement from './DefaultDOMElement'
import inBrowser from '../util/inBrowser'

var __id__ = 0

/**
  A light-weight component implementation inspired by
  [React](https://facebook.github.io/react/) and [Ember](http://emberjs.com/).
  In contrast to the large frameworks it does much less things automagically in
  favour of synchronous rendering and a minimalistic life-cycle. It also
  provides *up-tree* communication and *dependency injection*.

  ### Why synchronous rendering?

  Synchronous rendering, while it may *seem* less performant, is necessary
  because substance must render the model, after it has changed before the next
  change is triggered by the user.

  Asynchronous rendering as it exists in React means that the UI will
  eventually *catch* up to changes in the model. This is not acceptable in
  substance because substance plays with contenteditable and thus, cursor
  positions, etc are maintained in the browser's DOM. If we went the async way,
  the cursor in the DOM would be briefly inconsistent with the cursor in the
  model. In this brief window, changes triggered by the user would be impossible
  to apply.

  ### Concepts:

  - `props` are provided by a parent component.  An initial set of properties is provided
  via constructor. After that, the parent component can call `setProps` or `extendProps`
  to update these properties which triggers rerendering if the properties change.

  - `state` is a set of flags and values which are used to control how the component
  gets rendered given the current props. Using `setState` the component can change
  its internal state, which leads to a rerendering if the state changes.
  Prefer using `extendState` rather than `setState`.

    Normally, a component maintains its own state. It isn't recommended that a
  parent pass in or update state. If you find the need for this, you should be
  looking at `props`.

    State would be useful in situations where the component itself controls some
  aspect of rendering. Eg. whether a dropdown is open or not could be a state
  within the dropdown component itself since no other component needs to know
  it.

  - A child component with a `ref` id will be reused on rerender. All others will be
  wiped and rerender from scratch. If you want to preserve a grand-child (or lower), then
  make sure that all anchestors have a ref id. After rendering the child will be
  accessible via `this.refs[ref]`.

  - A component can send actions via `send` which are bubbled up through all parent
  components until one handles it. A component declares that it can handle an
  action by calling the `handleActions` method on itself in the constructor or
  the `didUpdate` lifecycle hook.

  ### Lifecycle hooks

  The {@link ui/RenderingEngine} triggers a set of hooks for you to define behavior
  in various stages of the rendering cycle. The names are pretty self
  explanatory. If in doubt, please check out the method documentation below.

  1. {@link ui/Component#didMount}
  1. {@link ui/Component#didUpdate}
  1. {@link ui/Component#dispose}
  1. {@link ui/Component#willReceiveProps}
  1. {@link ui/Component#willUpdateState}

  @implements util/EventEmitter

  @example

  Define a component:

  ```
  class HelloMessage extends Component {
    render() {
      return $$('div').append(
        'Hello ',
        this.props.name
      )
    }
  }
  ```

  And mount it to a DOM Element:

  ```
  HelloMessage.mount({name: 'John'}, document.body)
  ```
*/
class Component extends DOMElement.Delegator {
  /**
    Construcutor is only used internally.

    @constructor
    @param {Component} parent The parent component
    @param {Object} props     Properties against which this class must
                              be rendered the first time.
  */
  constructor(parent, props) {
    super()

    // HACK: allowing skipping execution of this ctor
    if (arguments[0] === 'SKIP') return

    this.__id__ = __id__++

    this.parent = parent
    this.el = null
    this.refs = {}

    // HACK: a temporary solution to handle refs owned by an ancestor
    // is to store them here as well, so that we can map virtual components
    // efficiently
    this.__foreignRefs__ = {}
    this._actionHandlers = {}

    // context from parent (dependency injection)
    this.context = this._getContext() || {}
    Object.freeze(this.context)
    // setting props without triggering willReceiveProps
    this.props = props || {}
    Object.freeze(this.props)
    this.state = this.getInitialState() || {}
    Object.freeze(this.state)
  }

  /**
    Provides the context which is delivered to every child component. Override
    if you want to provide your own child context. Child context is available to
    all components rendered from within this component's render method as
    `this.context`.

    @example

    ```
    class A extends Component {
    ...
      getChildContext() {
        // Optional, but useful to merge super's context
        return Object.assign({}, super.getChildContext(), {foo: 'bar'})
      }

      render($$) {
        return $$(B)
      }
    }

    class B extends Component {
      render($$) {
        // this.context.foo is available here
      }
    }
    ```
    Component

    @return {Object} the child context
  */
  getChildContext() {
    return this.childContext || {}
  }

  /**
    Override this within your component to provide the initial state for the
    component. This method is internally called by the
    {@link ui/RenderingEngine} and the state defined here is made available to
    the {@link ui/Component#render} method as this.state.

    @return {Object} the initial state
  */
  getInitialState() {
    return {}
  }

  /**
    Provides the parent of this component.

    @return {Component} the parent component or null if this component does not have a parent.
  */
  getParent() {
    return this.parent
  }

  /**
    Get the top-most Component. This the component mounted using
    {@link ui/Component.mount}
    @return {Component} The root component
  */
  getRoot() {
    var comp = this
    var parent = comp
    while (parent) {
      comp = parent
      parent = comp.getParent()
    }
    return comp
  }

  getNativeElement() {
    return this.el.getNativeElement()
  }

  /**
    Short hand for using labelProvider API

    @example

    ```
    render($$) {
      let el = $$('div').addClass('sc-my-component')
      el.append(this.getLabel('first-name'))
      return el
    }
    ```
  */
  getLabel(name) {
    let labelProvider = this.context.labelProvider
    if (!labelProvider) throw new Error('Missing labelProvider.')
    return labelProvider.getLabel(name)
  }

  /**
    Get a component class for the component name provided. Use this within the
    render method to render children nodes.

    @example

    ```
    render($$) {
      let el = $$('div').addClass('sc-my-component')
      let caption = this.props.node.getCaption() // some method that returns a node
      let CaptionClass = this.getComponent(caption.type)
      el.append($$(CaptionClass, {node: caption}))
      return el
    }
    ```

    @param  {String} componentName The component's registration name
    @param  {Boolean} maybe if `true` then does not throw when no Component is found
    @return {Class}                The ComponentClass
  */
  getComponent(nodeType, maybe) {
    let componentRegistry = this.getComponentRegistry()
    if (!componentRegistry) throw new Error('Missing componentRegistry.')
    const ComponentClass = componentRegistry.get(nodeType)
    if (!maybe && !ComponentClass) {
      throw new Error('No Component registered with name ' + nodeType)
    }
    return ComponentClass
  }

  getComponentRegistry() {
    return this.context.componentRegistry
  }

  /**
    Render the component.

    ATTENTION: this does not create a DOM presentation but
    a virtual representation which is compiled into a DOM element later.

    Every Component should override this method.

    @param {Function} $$ method to create components
    @return {VirtualNode} VirtualNode created using {@param $$}
  */
  render($$) {
    /* istanbul ignore next */
    return $$('div')
  }

  /**
    Mount a component to the DOM.

    @example

    ```
    var app = Texture.mount({
      configurator: configurator,
      documentId: 'elife-15278'
    }, document.body)
    ```
  */
  mount(el) {
    if (!el) {
      throw new Error('Element is required.')
    }
    if (!this.el) {
      this._render()
    }
    if (!el._isDOMElement) {
      el = DefaultDOMElement.wrapNativeElement(el)
    }
    el.appendChild(this.el)
    if (el.isInDocument()) {
      this.triggerDidMount(true)
    }
    return this
  }

  /**
    Determines if Component should be rendered again using {@link ui/Component#rerender}
    after changing props. For comparisons, you can use `this.props` and
    `newProps`.

    The default implementation simply returns true.

    @param {Object} newProps The props are being applied to this component.
    @return a boolean indicating whether rerender() should be run.
  */
  shouldRerender(newProps) { // eslint-disable-line
    return true
  }

  /**
    Rerenders the component.

    Call this to manually trigger a rerender.
  */
  rerender() {
    this._rerender(this.props, this.state)
  }

  _rerender(oldProps, oldState) {
    this._render(oldProps, oldState)
    // when this component is not mounted still trigger didUpdate()
    if (!this.isMounted()) {
      this.didUpdate(oldProps, oldState)
    }
  }

  _render(oldProps, oldState) {
    if (this.__isRendering__) {
      throw new Error('Component is rendering already.')
    }
    this.__isRendering__ = true
    try {
      var engine = new RenderingEngine()
      engine._render(this, oldProps, oldState)
    } finally {
      delete this.__isRendering__
    }
  }

  /**
    Triggers didMount handlers recursively.

    Gets called when using `component.mount(el)` on an element being
    in the DOM already. Typically this is done for a root component.

    If this is not possible because you want to do things differently, make sure
    you call 'component.triggerDidMount()' on root components.

    @param isMounted an optional param for optimization, it's used mainly internally
    @private
    @example

    ```
    var frag = document.createDocumentFragment()
    var comp = MyComponent.mount(frag)
    ...
    $('body').append(frag)
    comp.triggerDidMount()
    ```
  */
  triggerDidMount() {
    // Trigger didMount for the children first
    this.getChildren().forEach(function(child) {
      // We pass isMounted=true to save costly calls to Component.isMounted
      // for each child / grandchild
      child.triggerDidMount(true)
    })
    // To prevent from multiple calls to didMount, which can happen under
    // specific circumstances we use a guard.
    if (!this.__isMounted__) {
      this.__isMounted__ = true
      this.didMount()
    }
  }

  /**
    Called when the element is inserted into the DOM. Typically, you can use
    this to set up subscriptions to changes in the document or in a node of
    your interest.

    Remember to unsubscribe from all changes in the {@link ui/Component#dispose}
    method otherwise listeners you have attached may be called without a context.

    @example

    ```javascript
    class Foo extends Component {
      didMount() {
        this.props.node.on('label:changed', this.rerender, this)
      }

      dispose() {
        // unless this is done, rerender could be called for a dead, disposed
        // component instance.
        this.props.node.off(this)
      }
    }
    ```

    Make sure that you call `component.mount(el)` using an element
    which is already in the DOM.

    ```javascript
    var component = new MyComponent()
    component.mount($('body')[0])
    ```
  */
  didMount() {}

  /**
    Hook which is called after state or props have been updated and the implied
    rerender is completed.
  */
  didUpdate() {}

  /**
    @return {boolean} indicating if this component has been mounted
   */
  isMounted() {
    return this.__isMounted__
  }

  /**
   Triggers dispose handlers recursively.

   @private
  */
  triggerDispose() {
    this.getChildren().forEach(function(child) {
      child.triggerDispose()
    })
    this.dispose()
    this.__isMounted__ = false
  }

  /**
    A hook which is called when the component is unmounted, i.e. removed from DOM,
    hence disposed. See {@link ui/Component#didMount} for example usage.

    Remember to unsubscribe all change listeners here.
  */
  dispose() {}

  /*
    Attention: this is used when a preserved component is relocated.
    E.g., rendered with a new parent.
  */
  _setParent(newParent) {
    this.parent = newParent
    this.context = this._getContext() || {}
    Object.freeze(this.context)
  }

  /**
    Send an action request to the parent component, bubbling up the component
    hierarchy until an action handler is found.

    @param action the name of the action
    @param ... arbitrary number of arguments
    @returns {Boolean} true if the action was handled, false otherwise
    @example
  */
  send(action) {
    var comp = this
    while(comp) {
      if (comp._actionHandlers && comp._actionHandlers[action]) {
        comp._actionHandlers[action].apply(comp, Array.prototype.slice.call(arguments, 1))
        return true
      }
      comp = comp.getParent()
    }
    console.warn('Action', action, 'was not handled.')
    return false
  }

  /**
    Define action handlers. Call this during construction/initialization of a component.
    @param {Object} actionHandler  An object where the keys define the handled
        actions and the values define the handler to be invoked.

    These handlers are automatically removed once the Component is disposed, so
    there is no need to unsubscribe these handlers in the {@link ui/Component#dispose}
    hook.

    @example

    ```
    class MyComponent extends Component {
      constructor(...args) {
        super(...args)
        this.handleActions({
         'openPrompt': this.openPrompt,
         'closePrompt': this.closePrompt
        })
      }
    }
    ```
  */
  handleActions(actionHandlers) {
    each(actionHandlers, function(method, actionName) {
      this.handleAction(actionName, method)
    }.bind(this))
    return this
  }

  /**
    Define an action handler. Call this during construction/initialization of a component.

    @param {String} action name
    @param {Functon} a function of this component.
  */
  handleAction(name, handler) {
    if (!name || !handler || !isFunction(handler)) {
      throw new Error('Illegal arguments.')
    }
    handler = handler.bind(this)
    this._actionHandlers[name] = handler
  }

  /**
    Get the current component state

    @return {Object} the current state
  */
  getState() {
    return this.state
  }

  /**
    Sets the state of this component, potentially leading to a rerender. It is
    better practice to use {@link ui/Component#extendState}. That way, the code
    which updates state only updates part relevant to it.

    Eg. If you have a Component that has a dropdown open state flag and another
    enabled/disabled state flag for a node in the dropdown, you want to isolate
    the pieces of your code making the two changes. The part of your code
    opening and closing the dropdown should not also automatically change or
    remove the enabled flag.

    Note: Usually this is used by the component itself.
    @param {object} newState an object with a partial update.
  */
  setState(newState) {
    var oldProps = this.props
    var oldState = this.state
    // Note: while setting props it is allowed to call this.setState()
    // which will not lead to an extra rerender
    var needRerender = !this.__isSettingProps__ &&
      this.shouldRerender(this.getProps(), newState)
    // triggering this to provide a possibility to look at old before it is changed
    this.willUpdateState(newState)
    this.state = newState || {}
    Object.freeze(this.state)
    if (needRerender) {
      this._rerender(oldProps, oldState)
    } else if (!this.__isSettingProps__) {
      this.didUpdate(oldProps, oldState)
    }
  }

  /**
    This is similar to `setState()` but extends the existing state instead of
    replacing it.

    @param {object} newState an object with a partial update.
  */
  extendState(newState) {
    newState = extend({}, this.state, newState)
    this.setState(newState)
  }

  /**
    Called before state is changed.
  */
  willUpdateState(newState) { // eslint-disable-line
  }

  /**
    Get the current properties

    @return {Object} the current state
  */
  getProps() {
    return this.props
  }

  /**
    Sets the properties of this component, potentially leading to a rerender.

    @param {object} an object with properties
  */
  setProps(newProps) {
    var oldProps = this.props
    var oldState = this.state
    var needRerender = this.shouldRerender(newProps, this.state)
    this._setProps(newProps)
    if (needRerender) {
      this._rerender(oldProps, oldState)
    } else {
      this.didUpdate(oldProps, oldState)
    }
  }

  _setProps(newProps) {
    newProps = newProps || {}
    // set a flag so that this.setState() can omit triggering render
    this.__isSettingProps__ = true
    try {
      this.willReceiveProps(newProps)
      this.props = newProps || {}
      Object.freeze(newProps)
    } finally {
      delete this.__isSettingProps__
    }
  }

  /**
    Extends the properties of the component, without necessarily leading to a
    rerender.

    @param {object} an object with properties
  */
  extendProps(updatedProps) {
    var newProps = extend({}, this.props, updatedProps)
    this.setProps(newProps)
  }

  /**
    Hook which is called before properties are updated. Use this to dispose objects which will be replaced when properties change.

    For example you can use this to derive state from props.
    @param {object} newProps
  */
  willReceiveProps(newProps) { // eslint-disable-line
  }

  getChildNodes() {
    if (!this.el) return []
    var childNodes = this.el.getChildNodes()
    childNodes = childNodes.map(_unwrapComp).filter(notNull)
    return childNodes
  }

  getChildren() {
    if (!this.el) return []
    var children = this.el.getChildren()
    children = children.map(_unwrapComp).filter(notNull)
    return children
  }

  getChildAt(pos) {
    var node = this.el.getChildAt(pos)
    return _unwrapCompStrict(node)
  }

  find(cssSelector) {
    var el = this.el.find(cssSelector)
    return _unwrapComp(el)
  }

  findAll(cssSelector) {
    var els = this.el.findAll(cssSelector)
    return els.map(_unwrapComp).filter(notNull)
  }

  appendChild(child) {
    this.insertAt(this.getChildCount(), child)
  }

  insertAt(pos, childEl) {
    if (isString(childEl)) {
      childEl = new VirtualElement.TextNode(childEl)
    }
    if (!childEl._isVirtualElement) {
      throw new Error('Invalid argument: "child" must be a VirtualElement.')
    }
    var child = new RenderingEngine()._renderChild(this, childEl)
    this.el.insertAt(pos, child.el)
    _mountChild(this, child)
  }

  removeAt(pos) {
    var childEl = this.el.getChildAt(pos)
    if (childEl) {
      var child = _unwrapCompStrict(childEl)
      _disposeChild(child)
      this.el.removeAt(pos)
    }
  }

  removeChild(child) {
    if (!child || !child._isComponent) {
      throw new Error('removeChild(): Illegal arguments. Expecting a Component instance.')
    }
    // TODO: remove ref from owner
    _disposeChild(child)
    this.el.removeChild(child.el)
  }

  replaceChild(oldChild, newChild) {
    if (!newChild || !oldChild ||
        !newChild._isComponent || !oldChild._isComponent) {
      throw new Error('replaceChild(): Illegal arguments. Expecting BrowserDOMElement instances.')
    }
    // Attention: Node.replaceChild has weird semantics
    _disposeChild(oldChild)
    this.el.replaceChild(newChild.el, oldChild.el)
    if (this.isMounted()) {
      newChild.triggerDidMount(true)
    }
  }

  empty() {
    if (this.el) {
      this.getChildNodes().forEach(function(child) {
        _disposeChild(child)
      })
      this.el.empty()
    }
    return this
  }

  remove() {
    _disposeChild(this)
    this.el.remove()
  }

  _getContext() {
    var context = {}
    var parent = this.getParent()
    if (parent) {
      context = extend(context, parent.context)
      if (parent.getChildContext) {
        return extend(context, parent.getChildContext())
      }
    }
    return context
  }

  addEventListener() {
    throw new Error("Not supported.")
  }

  removeEventListener() {
    throw new Error("Not supported.")
  }

  insertBefore() {
    throw new Error("Not supported.")
  }

}

Component.prototype._isComponent = true
EventEmitter.mixin(Component)
DOMElement._defineProperties(Component, DOMElement._propertyNames)

Component.unwrap = _unwrapComp

Component.render = function(props) {
  props = props || {}
  var ComponentClass = this
  var comp = new ComponentClass(null, props)
  comp._render()
  return comp
}

Component.mount = function(props, el) {
  if (arguments.length === 1) {
    props = {}
    el = arguments[0]
  }
  if (!el) throw new Error("'el' is required.")
  if (isString(el)) {
    var selector = el
    if (inBrowser) {
      el = window.document.querySelector(selector)
    } else {
      throw new Error("This selector is not supported on server side.")
    }
  }
  if (!el._isDOMElement) {
    el = new DefaultDOMElement.wrapNativeElement(el)
  }
  var ComponentClass = this
  var comp = new ComponentClass(null, props)
  comp.mount(el)
  return comp
}

Object.defineProperty(Component, '$$', {
  get: function() {
    throw new Error([
      "With Substance Beta 4 we introduced a breaking change.",
      "We needed to turn the former static Component.$$ into a contextualized implementation, which is now served via Component.render($$).",
      "FIX: change your signature of 'this.render()' in all your Components to 'this.render($$)"
    ].join("\n"))
  }
})

Component.unwrapDOMElement = function(el) {
  return _unwrapComp(el)
}

Component.getComponentFromNativeElement = function(nativeEl) {
  // while it sounds strange to wrap a native element
  // first, it makes sense after all, as DefaultDOMElement.wrapNativeElement()
  // provides the DOMElement instance of a previously wrapped native element.
  return _unwrapComp(DefaultDOMElement.wrapNativeElement(nativeEl))
}

function _disposeChild(child) {
  child.triggerDispose()
  if (child._owner && child._ref) {
    console.assert(child._owner.refs[child._ref] === child, "Owner's ref should point to this child instance.")
    delete child._owner.refs[child._ref]
  }
}

function _mountChild(parent, child) {
  if (parent.isMounted()) {
    child.triggerDidMount(true)
  }
  if (child._owner && child._ref) {
    child._owner.refs[child._ref] = child
  }
}


function _unwrapComp(el) {
  if (el) return el._comp
}

function _unwrapCompStrict(el) {
  console.assert(el._comp, "Expecting a back-link to the component instance.")
  return _unwrapComp(el)
}

function notNull(n) { return n }


class ElementComponent extends Component {

  constructor(parent, virtualComp) {
    super('SKIP')

    if (!parent._isComponent) {
      throw new Error("Illegal argument: 'parent' must be a Component.")
    }
    if (!virtualComp._isVirtualHTMLElement) {
      throw new Error("Illegal argument: 'virtualComp' must be a VirtualHTMLElement.")
    }
    this.parent = parent
    this.context = this._getContext() || {}
    Object.freeze(this.context)
  }

}

ElementComponent.prototype._isElementComponent = true

class TextNodeComponent extends Component {

  constructor(parent, virtualComp) {
    super('SKIP')

    if (!parent._isComponent) {
      throw new Error("Illegal argument: 'parent' must be a Component.")
    }
    if (!virtualComp._isVirtualTextNode) {
      throw new Error("Illegal argument: 'virtualComp' must be a VirtualTextNode.")
    }
    this.parent = parent
  }

  setTextContent(text) {
    if (!this.el) {
      throw new Error('Component must be rendered first.')
    }
    if (this.el.textContent !== text) {
      var newEl = this.el.createTextNode(text)
      this.el._replaceNativeEl(newEl.getNativeElement())
    }
  }

  getChildNodes() {
    return []
  }

  getChildren() {
    return []
  }

}

TextNodeComponent.prototype._isTextNodeComponent = true

Component.Element = ElementComponent
Component.TextNode = TextNodeComponent

export default Component
