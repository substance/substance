import flattenDeep from 'lodash-es/flattenDeep'
import omit from 'lodash-es/omit'
import XNode from '../xdom/XNode'
import clone from '../util/clone'
import extend from '../util/extend'
import map from '../util/map'
import isArray from '../util/isArray'
import isFunction from '../util/isFunction'
import isNil from '../util/isNil'
import isPlainObject from '../util/isPlainObject'
import isString from '../util/isString'
import without from '../util/without'

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
    // set when this gets inserted into another virtual element
    this._parent = null
    // a reference to the owner Component instance
    this._owner = null
    // a reference to the RenderingContext
    this._context = null
    // set when ref'd
    this._ref = null
  }

  getParent() {
    return this._parent
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

}

VirtualNode.prototype._isVirtualNode = true


class VirtualElement extends VirtualNode {

  constructor() {
    super()

    this.classes = new Set()
    this.attributes = new Map()
    this.htmlProps = new Map()
    this.style = new Map()
    this.eventListeners = []
  }

  hasClass(className) {
    return this.classes.indexOf(className) > -1
  }

  addClass(className) {
    if (!this.classNames) {
      this.classNames = []
    }
    this.classNames.push(className)
    return this
  }

  removeClass(className) {
    if (this.classNames) {
      this.classNames = without(this.classNames, className)
    }
    return this
  }

  removeAttr(attr) {
    if (this.attributes) {
      if (isString(attr)) {
        delete this.attributes[attr]
      } else {
        this.attributes = omit(this.attributes, attr)
      }
    }
    return this
  }

  getAttribute(name) {
    if (this.attributes) {
      return this.attributes[name]
    }
  }

  setAttribute(name, value) {
    if (!this.attributes) {
      this.attributes = {}
    }
    this.attributes[name] = value
    return this
  }

  getAttributes() {
    // we are having separated storages for differet
    // kind of attributes which we now pull together
    // in the same way as a native DOM element has it
    var attributes = {}
    if (this.attributes) {
      extend(attributes, this.attributes)
    }
    if (this.classNames) {
      attributes.class = this.classNames.join(' ')
    }
    if (this.style) {
      attributes.style = map(this.style, function(val, key) {
        return key + ":" + val
      }).join(';')
    }
    return attributes
  }

  getValue() {
    return this.htmlProp('value')
  }

  setValue(value) {
    this.htmlProp('value', value)
    return this
  }

  getProperty(name) {
    if (this.htmlProps) {
      return this.htmlProps[name]
    }
  }

  setProperty(name, value) {
    if (!this.htmlProps) {
      this.htmlProps = {}
    }
    this.htmlProps[name] = value
    return this
  }

  removeProperty(name) {
    if (this.htmlProps) {
      delete this.htmlProps[name]
    }
    return this
  }

  getStyle(name) {
    if (this.style) {
      return this.style[name]
    }
  }

  setStyle(name, value) {
    if (!this.style) {
      this.style = {}
    }
    this.style[name] = value
    return this
  }

  addEventListener(eventName, handler, options) {
    var listener
    if (arguments.length === 1 && arguments[0]._isDOMEventListener) {
      listener = arguments[0]
    } else {
      options = options || {}
      options.context = options.context || this._owner._comp
      listener = new DOMEventListener(eventName, handler, options)
    }
    if (!this.eventListeners) {
      this.eventListeners = []
    }
    this.eventListeners.push(listener)
    return this
  }

  removeEventListener(eventName, handler) {
    if (this.eventListeners) {
      DOMEventListener.findIndex(this.eventListeners, eventName, handler)
    }
    return this
  }

  getEventListeners() {
    return this.eventListeners
  }

  _normalizeChild(child) {
    if (isString(child)) {
      child = new VirtualTextNode(child)
    }
    return child
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
    // TODO: discuss. Having a bad feeling about this,
    // because it could obscure an implementation error
    if (!child) return
    outlet.push(child)
    this._attach(child)
    return child
  }

  _insertAt(outlet, pos, child) {
    if (!child) return
    outlet.splice(pos, 0, child)
    this._attach(child)
  }

  _removeAt(outlet, pos) {
    var child = outlet[pos]
    outlet.splice(pos, 1)
    this._detach(child)
  }

  _attach(child) {
    child.parent = this
    if (this._context && child._owner !== this._owner && child._ref) {
      this._context.foreignRefs[child._ref] = child
    }
  }

  _detach(child) {
    child.parent = null
    if (this._context && child._owner !== this._owner && child._ref) {
      delete this.context.foreignRefs[child._ref]
    }
  }

  _mergeHTMLConfig(other) {
    if (other.classNames) {
      if (!this.classNames) {
        this.classNames = []
      }
      this.classNames = this.classNames.concat(other.classNames)
    }
    if (other.attributes) {
      if (!this.attributes) {
        this.attributes = {}
      }
      extend(this.attributes, other.attributes)
    }
    if (other.htmlProps) {
      if (!this.htmlProps) {
        this.htmlProps = {}
      }
      extend(this.htmlProps, other.htmlProps)
    }
    if (other.style) {
      if (!this.style) {
        this.style = {}
      }
      extend(this.style, other.style)
    }
    if (other.eventListeners) {
      if (!this.eventListeners) {
        this.eventListeners = []
      }
      this.eventListeners = this.eventListeners.concat(other.eventListeners)
    }
  }

  _copyHTMLConfig() {
    return {
      classNames: clone(this.classNames),
      attributes: clone(this.attributes),
      htmlProps: clone(this.htmlProps),
      style: clone(this.style),
      eventListeners: clone(this.eventListeners)
    }
  }

}

/*
  A virtual HTML element.
*/
class VirtualElement extends VirtualNode {

  constructor(tagName) {
    super('tag', { name: tagName})
  }

  isElementNode() {
    return true
  }

  getNodeType() {
    return "element"
  }

}

VirtualElement.prototype._isVirtualElement = true


/*
  A virtual element which gets rendered by a custom component.

  @private
*/
class VirtualComponent extends VirtualNode {

  constructor(ComponentClass, props) {
    super()

    this.ComponentClass = ComponentClass
    this.props = props || {}
  }

  getNodeType() {
    return 'component'
  }

  outlet(name) {
    return new Outlet(this, name)
  }

  _attach(child) {
    child._preliminaryParent = this
  }

  _detach(child) {
    child._preliminaryParent = null
  }
}

class VirtualTextNode extends VirtualNode {

  constructor(text) {
    super('text', { data: text })
  }

  isTextNode() { return true }

}

VirtualTextNode.prototype._isVirtualTextNode = true

VirtualElement.Component = VirtualComponent
VirtualElement.TextNode = VirtualTextNode

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

export default VirtualElement
