import flattenDeep from 'lodash-es/flattenDeep'
import XNode from '../dom/XNode'
import isFunction from '../util/isFunction'
import isNil from '../util/isNil'
import isPlainObject from '../util/isPlainObject'
import isString from '../util/isString'
import isArray from '../util/isArray'

/**
  A virtual {@link DOMElement} which is used by the {@link Component} API.

  A VirtualElement is just a description of a DOM structure. It represents a virtual
  DOM mixed with Components. This virtual structure needs to be compiled to a {@link Component}
  to actually create a real DOM element.
*/
class VirtualNode extends XNode {

  constructor(type, args) {
    super(type, args)

    // a reference to the Component instance
    this._comp = null
    // a reference to the owner Component instance
    this._owner = null
    // a reference to the RenderingContext
    this._context = null
    // set when ref'd
    this._ref = null
  }

  /*
    Provides the component after this VirtualElement has been rendered.
  */
  getComponent() {
    return this._comp
  }

  /**
    Associates a reference identifier with this element.

    When rendered the corresponding component is stored in the owner using the given key.
    In addition to that, components with a reference are preserved when its parent is rerendered.

    > Attention: only the owner should use this method, as it only
      affects the owner's references

    @param {String} ref id for the compiled Component
  */
  ref(ref) {
    if (!ref) throw new Error('Illegal argument')
    /*
      Attention: only the owner can create a ref()
      If you run into this situation, e.g. when you pass down a virtual element
      to a component which wants to have a ref itself,
      then you have other options:

      1. via props:
      ```js
        this.props.content.getComponent()
      ```

      2. via Component.getChildAt or Component.find()
      ```
        this.getChildAt(0)
        this.find('.child')
      ```
    */
    if (this._ref) throw new Error('A VirtualElement can only be referenced once.')
    this._ref = ref
    if (this._context) {
      this._context.refs[ref] = this
    }
    return this
  }

  _normalizeChild(child) {
    if (isNil(child)) return null
    if (child._isXNode) {
      if (!child._isVirtualNode) {
        if (child.type === 'tag') {
          child = new VirtualElement(child.name, child)
        } else if (child.type === 'text') {
          child = new VirtualTextNode(child.data)
        } else {
          return null
        }
      }
    } else {
      child = new VirtualTextNode(String(child))
    }
    if (!child._isVirtualNode) throw new Error('Illegal argument: child must be an instance of VirtualNode.')
    return child
  }

  _onAttach(child) {
    if (this._context && child._owner !== this._owner && child._ref) {
      this._context.foreignRefs[child._ref] = child
    }
  }

  _onDetach(child) {
    if (this._context && child._owner !== this._owner && child._ref) {
      delete this.context.foreignRefs[child._ref]
    }
  }

  createTextNode(text) {
    return new VirtualTextNode(text, { ownerDocument: this.ownerDocument })
  }

  createElement(tagName) {
    return new VirtualElement(tagName, { ownerDocument: this.ownerDocument })
  }

}

VirtualNode.prototype._isVirtualNode = true

/*
  A virtual HTML element.
*/
class VirtualElement extends VirtualNode {

  constructor(tagName, opts = {}) {
    super('tag', Object.assign({ name: tagName }, opts))
  }

  isElementNode() {
    return true
  }

  getNodeType() {
    return "element"
  }

  // FIXME: support setInnerHTML
  hasInnerHTML() { return false }

}

VirtualElement.prototype._isVirtualElement = true

/*
  A virtual element which gets rendered by a custom component.

  @private
*/
class VirtualComponent extends VirtualNode {

  constructor(ComponentClass, props) {
    super('component')

    this.ComponentClass = ComponentClass
    this.props = props || {}
  }

  getNodeType() {
    return 'component'
  }

  outlet(name) {
    return new Outlet(this, name)
  }

  // Note: overriding structural DOMElement API
  // as it has a special semantics (considering outlets)
  // in the context of VirtualComponents
  // VirtualComponents are actually leafs in the sense of VirtualNodes
  // instead they have outlets, i.e. props containing children

  append(...args) {
    this._append(this._defaultOutlet(), ...args)
    return this
  }

  appendChild(...args) {
    this._appendChild(this._defaultOutlet(), ...args)
    return this
  }

  insertAt() {
    throw new Error('insertAt() is not supported on VirtualComponents.')
  }

  insertBefore() {
    throw new Error('insertBefore() is not supported on VirtualComponents.')
  }

  removeAt() {
    throw new Error('removeAt() is not supported on VirtualComponents.')
  }

  removeChild() {
    throw new Error('removeAt() is not supported on VirtualComponents.')
  }

  replaceChild() {
    throw new Error('replaceChild() is not supported on VirtualComponents.')
  }

  empty() {
    throw new Error('empty() is not supported on VirtualComponents.')
  }

  _defaultOutlet() {
    if (!this.props.children) this.props.children = []
    return this.props.children
  }

  _append(outlet, args) {
    if (args.length === 1 && !isArray(args[0])) {
      this._appendChild(outlet, args[0])
      return
    }
    let children
    if (isArray(args[0])) {
      children = args[0]
    } else if (arguments.length > 1) {
      children = Array.prototype.slice.call(args,0)
    } else {
      return
    }
    children.forEach(this._appendChild.bind(this, outlet))
  }

  _appendChild(outlet, child) {
    child = this._normalizeChild(child)
    if (!child) return this
    outlet.push(child)
    this._onAttach(child)
  }

  // TODO: rethink the _preliminaryParent stuff
  // it seems inconsistent to me, as children provided via props
  // would not have this property set
  _onAttach(child) {
    child._preliminaryParent = this
  }
}

VirtualComponent.prototype._isVirtualComponent = true

class VirtualTextNode extends VirtualNode {

  constructor(text, opts = {}) {
    super('text', Object.assign({ data: text }, opts))
  }

  isTextNode() { return true }

}

VirtualTextNode.prototype._isVirtualTextNode = true

VirtualNode.Component = VirtualComponent
VirtualNode.TextNode = VirtualTextNode

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
VirtualNode.createElement = function() {
  var content
  var _first = arguments[0]
  var _second = arguments[1]
  var type
  if (isString(_first)) {
    type = "element"
  } else if (isFunction(_first) && _first.prototype._isComponent) {
    type = "component"
  } else if (isNil(_first)) {
    throw new Error('$$(null): provided argument was null or undefined.')
  } else {
    throw new Error('Illegal usage of $$()')
  }
  // some props are mapped to built-ins
  var props = {}
  var classNames, ref
  var eventHandlers = []
  for(var key in _second) {
    if (!_second.hasOwnProperty(key)) continue
    var val = _second[key]
    switch(key) {
      case 'class':
        classNames = val
        break
      case 'ref':
        ref = val
        break
      default:
        props[key] = val
    }
  }
  if (type === 'element') {
    content = new VirtualElement(_first)
    // remaining props are attributes
    // TODO: should we make sure that these are only string values?
    content.attr(props)
  } else {
    content = new VirtualComponent(_first, props)
  }
  // HACK: this is set to the current context by RenderingEngine
  // otherwise this will provide rubbish
  content._owner = this.owner
  if (classNames) {
    content.addClass(classNames)
  }
  if (ref) {
    content.ref(ref)
  }
  eventHandlers.forEach(function(h) {
    if (isFunction(h.handler)) {
      content.on(h.name, h.handler)
    } else if (isPlainObject(h.handler)) {
      var params = h.handler
      content.on(h.name, params.handler, params.context, params)
    } else {
      throw new Error('Illegal arguments for $$(_,{ on'+h.name+'})')
    }
  })
  // allow a notation similar to React.createElement
  // $$(MyComponent, {}, ...children)
  if (arguments.length > 2) {
    content.append(flattenDeep(Array.prototype.slice.call(arguments, 2)))
  }
  return content
}

class Outlet {
  constructor(virtualEl, name) {
    this.virtualEl = virtualEl
    this.name = name
    Object.freeze(this)
  }

  _getOutlet() {
    var outlet = this.virtualEl.props[this.name]
    if (!outlet) {
      outlet = []
      this.virtualEl.props[this.name] = outlet
    }
    return outlet
  }

  append() {
    var outlet = this._getOutlet()
    this.virtualEl._append(outlet, arguments)
    return this
  }

  empty() {
    var arr = this.virtualEl.props[this.name]
    arr.forEach(function(el) {
      this._detach(el)
    }.bind(this))
    arr.splice(0, arr.length)
    return this
  }
}

export default VirtualNode
