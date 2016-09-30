import clone from 'lodash/clone'
import extend from 'lodash/extend'
import flattenDeep from 'lodash/flattenDeep'
import isArray from 'lodash/isArray'
import isFunction from 'lodash/isFunction'
import isNil from 'lodash/isNil'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import map from 'lodash/map'
import omit from 'lodash/omit'
import without from 'lodash/without'
import DOMElement from './DOMElement'

/**
  A virtual {@link ui/DOMElement} which is used by the {@link ui/Component} API.

  A VirtualElement is just a description of a DOM structure. It represents a virtual
  DOM mixed with Components. This virtual structure needs to be compiled to a {@link ui/Component}
  to actually create a real DOM element.

  @class
*/
class VirtualElement extends DOMElement {

  constructor(owner) {
    super()

    // set when this gets inserted into another virtual element
    this.parent = null
    // set when created by RenderingContext
    this._owner = owner
    // set when ref'd
    this._ref = null
  }

  /*
    For instance of like checks.
  */
  get _isVirtualElement() { return true }

  getParent() {
    return this.parent
  }

  /**
    Associates a reference identifier with this element.

    When rendered the corresponding component is stored in the owner using the given key.
    In addition to that, components with a reference are preserved when its parent is rerendered.

    @param {String} ref id for the compiled Component
  */
  ref(ref) {
    if (!ref) {
      throw new Error('Illegal argument')
    }
    this._ref = ref
    if (this._context) {
      this._context.refs[ref] = this
    }
    return this
  }

}

DOMElement._defineProperties(VirtualElement, without(DOMElement._propertyNames, 'children'))

/*
  A virtual HTML element.

  @private
  @class VirtualElement.VirtualHTMLElement
  @extends ui/VirtualElement
*/
class VirtualHTMLElement extends VirtualElement {

  constructor(tagName) {
    super()

    this._tagName = tagName
    this.classNames = null
    this.attributes = null
    this.htmlProps = null
    this.style = null
    this.eventListeners = null

    this.children = []

  }

  get _isVirtualHTMLElement() { return true; }

  getTagName() {
    return this._tagName
  }

  setTagName(tagName) {
    this._tagName = tagName
    return this
  }

  hasClass(className) {
    if (this.classNames) {
      return this.classNames.indexOf(className) > -1
    }
    return false
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

  getId() {
    return this.getAttribute('id')
  }

  setId(id) {
    this.setAttribute('id', id)
    return this
  }

  setTextContent(text) {
    text = text || ''
    this.empty()
    this.appendChild(text)
    return this
  }

  setInnerHTML(html) {
    html = html || ''
    this.empty()
    this._innerHTMLString = html
    return this
  }

  getInnerHTML() {
    if (!this.hasOwnProperty('_innerHTMLString')) {
      throw new Error('Not supported.')
    } else {
      return this._innerHTMLString
    }
  }

  getValue() {
    return this.htmlProp('value')
  }

  setValue(value) {
    this.htmlProp('value', value)
    return this
  }

  getChildNodes() {
    return this.children
  }

  getChildren() {
    return this.children.filter(function(child) {
      return child.getNodeType() !== "text"
    })
  }

  isTextNode() {
    return false
  }

  isElementNode() {
    return true
  }

  isCommentNode() {
    return false
  }

  isDocumentNode() {
    return false
  }

  append() {
    if (this._innerHTMLString) {
      throw Error('It is not possible to mix $$.html() with $$.append(). You can call $$.empty() to reset this virtual element.')
    }
    this._append(this.children, arguments)
    return this
  }

  appendChild(child) {
    if (this._innerHTMLString) {
      throw Error('It is not possible to mix $$.html() with $$.append(). You can call $$.empty() to reset this virtual element.')
    }
    this._appendChild(this.children, child)
    return this
  }

  insertAt(pos, child) {
    child = this._normalizeChild(child)
    if (!child) {
      throw new Error('Illegal child: ' + child)
    }
    if (!child._isVirtualElement) {
      throw new Error('Illegal argument for $$.insertAt():' + child)
    }
    if (pos < 0 || pos > this.children.length) {
      throw new Error('insertAt(): index out of bounds.')
    }
    this._insertAt(this.children, pos, child)
    return this
  }

  insertBefore(child, before) {
    var pos = this.children.indexOf(before)
    if (pos > -1) {
      this.insertAt(pos, child)
    } else {
      throw new Error('insertBefore(): reference node is not a child of this element.')
    }
    return this
  }

  removeAt(pos) {
    if (pos < 0 || pos >= this.children.length) {
      throw new Error('removeAt(): Index out of bounds.')
    }
    this._removeAt(pos)
    return this
  }

  removeChild(child) {
    if (!child || !child._isVirtualElement) {
      throw new Error('removeChild(): Illegal arguments. Expecting a CheerioDOMElement instance.')
    }
    var idx = this.children.indexOf(child)
    if (idx < 0) {
      throw new Error('removeChild(): element is not a child.')
    }
    this.removeAt(idx)
    return this
  }

  replaceChild(oldChild, newChild) {
    if (!newChild || !oldChild ||
        !newChild._isVirtualElement || !oldChild._isVirtualElement) {
      throw new Error('replaceChild(): Illegal arguments. Expecting BrowserDOMElement instances.')
    }
    var idx = this.children.indexOf(oldChild)
    if (idx < 0) {
      throw new Error('replaceChild(): element is not a child.')
    }
    this.removeAt(idx)
    this.insertAt(idx, newChild)
    return this
  }

  empty() {
    var children = this.children
    while (children.length) {
      var child = children.pop()
      child.parent = null
    }
    delete this._innerHTMLString
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
      listener = new DOMElement.EventListener(eventName, handler, options)
    }
    if (!this.eventListeners) {
      this.eventListeners = []
    }
    this.eventListeners.push(listener)
    return this
  }

  removeEventListener(eventName, handler) {
    if (this.eventListeners) {
      DOMElement._findEventListenerIndex(this.eventListeners, eventName, handler)
    }
    return this
  }

  getEventListeners() {
    return this.eventListeners
  }

  getNodeType() {
    return "element"
  }

  hasInnerHTML() {
    return Boolean(this._innerHTMLString)
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
    var children
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
}

/*
  A virtual element which gets rendered by a custom component.

  @private
  @class VirtualElement.VirtualComponent
  @extends ui/VirtualElement
*/
class VirtualComponent extends VirtualHTMLElement {

  constructor(ComponentClass, props) {
    super()

    props = props || {}

    this.ComponentClass = ComponentClass
    this.props = props
    if (!props.children) {
      props.children = []
    }
    this.children = props.children
  }

  get _isVirtualComponent() { return true; }

  getComponent() {
    return this._comp
  }

  // Note: for VirtualComponentElement we put children into props
  // so that the render method of ComponentClass can place it.
  getChildren() {
    return this.props.children
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


class VirtualTextNode extends VirtualElement {

  constructor(text) {
    super()
    this.text = text
  }

  get _isVirtualTextNode() { return true; }
}

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
        if (key.slice(0,2) === 'on') {
          eventHandlers.push({ name: key.slice(2), handler: val })
        } else {
          props[key] = val
        }
    }
  }
  if (type === 'element') {
    content = new VirtualHTMLElement(_first)
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

export default VirtualElement
