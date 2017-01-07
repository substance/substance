import {
  parseXML, parseHTML, createElement, createTextNode
} from 'substance-xdom'
import clone from '../util/clone'
import isString from '../util/isString'
import last from '../util/last'
import EventEmitter from '../util/EventEmitter'
import DOMElement from './DOMElement'

class MemoryDOMElement extends DOMElement {

  constructor(el) {
    super()

    this.el = el
    el._wrapper = this
  }

  getNativeElement() {
    return this.el
  }

  _wrapNativeElement(el) {
    _wrapNativeElement(el)
  }

  hasClass(className) {
    return this.el.hasClass(className)
  }

  addClass(className) {
    this.el.addClass(className)
    return this
  }

  removeClass(className) {
    this.el.removeClass(className)
    return this
  }

  getClasses() {
    return this.el.getAttribute('class')
  }

  setClasses(classString) {
    this.el.setAttribute('class', classString)
    return this
  }

  getAttribute(name) {
    return this.el.getAttribute(name)
  }

  setAttribute(name, value) {
    this.el.setAttribute(name, value)
    return this
  }

  removeAttribute(name) {
    this.el.removeAttribute(name)
    return this
  }

  getAttributes() {
    let attributes = clone(this.el.attribs)
    return attributes
  }

  getProperty(name) {
    return this.el.getProperty(name)
  }

  setProperty(name, value) {
    this.el.setProperty(name, value)
    return this
  }

  removeProperty(name) {
    this.el.removeProperty(name)
    return this
  }

  getTagName() {
    if (this.el.type !== 'tag') {
      return ""
    } else {
      return this.el.name.toLowerCase()
    }
  }

  setTagName(tagName) {
    this.el.name = tagName
    return this
  }

  getId() {
    return this.el.getAttribute('id')
  }

  setId(id) {
    this.el.setAttribute('id', id)
    return this
  }

  getTextContent() {
    return this.el.getTextContent()
  }

  setTextContent(text) {
    this.el.setTextContent(text)
    return this
  }

  getInnerHTML() {
    return this.el.getInnerHTML()
  }

  setInnerHTML(html) {
    this.el.setInnerHTML(html)
    return this
  }

  getOuterHTML() {
    return this.el.getOuterHTML()
  }

  getValue() {
    return this.el.getValue()
  }

  setValue(value) {
    this.el.setValue(value)
    return this
  }

  getStyle(name) {
    return this.el.getStyle(name)
  }

  setStyle(name, value) {
    this.el.setStyle(name, value)
    return this
  }

  addEventListener() {
    // stub
    return this
  }

  removeEventListener() {
    // stub
    return this
  }

  removeAllEventListeners() {
    // stub
    return this
  }

  getEventListeners() {
    // stub
    return []
  }

  getChildCount() {
    return this.el.children.length
  }

  getChildNodes() {
    let childNodes = this.el.children
    childNodes = childNodes.map(_wrapNativeElement)
    return childNodes
  }

  getChildren() {
    let children = this.el.children
    children = children.filter(function(node) {
      return node.type === "tag"
    })
    children = children.map(_wrapNativeElement)
    return children
  }

  getChildAt(pos) {
    return _wrapNativeElement(this.el.children[pos])
  }

  getChildIndex(child) {
    if (!child._isMemoryDOMElement) {
      throw new Error('Expecting a MemoryDOMElement instance.')
    }
    return this.el.children.indexOf(child.el)
  }

  getFirstChild() {
    let firstChild = this.el.children[0]
    if (firstChild) {
      return MemoryDOMElement.wrapNativeElement(firstChild)
    } else {
      return null
    }
  }

  getLastChild() {
    let lastChild = last(this.el.children)
    if (lastChild) {
      return MemoryDOMElement.wrapNativeElement(lastChild)
    } else {
      return null
    }
  }

  getNextSibling() {
    var next = this.el.next;
    if (next) {
      return MemoryDOMElement.wrapNativeElement(next)
    } else {
      return null
    }
  }

  getPreviousSibling() {
    let previous = this.el.previous
    if (previous) {
      return MemoryDOMElement.wrapNativeElement(previous)
    } else {
      return null
    }
  }

  isTextNode() {
    return this.el.type === "text"
  }

  isElementNode() {
    return this.el.type === "tag" || this.el.type === "script"
  }

  isCommentNode() {
    return this.el.type === "comment"
  }

  isDocumentNode() {
    // TODO: this is wrong. Only makes sense for HTML and only if this.el is really the document element
    return this.el === this.el.root
  }

  clone(deep) {
    return _wrapNativeElement(this.el.clone(deep))
  }

  createElement(tagName) {
    return _wrapNativeElement(createElement(tagName, { ownerDocument: this.el.ownerDocument }))
  }

  createTextNode(text) {
    return _wrapNativeElement(createTextNode(text, { ownerDocument: this.el.ownerDocument }))
  }

  is(cssSelector) {
    return this.el.is(cssSelector)
  }

  getParent() {
    let parent = this.el.parent
    if (parent) {
      return _wrapNativeElement(parent)
    } else {
      return null
    }
  }

  getRoot() {
    let el = this.el
    while (el.parent) el = el.parent
    return _wrapNativeElement(el)
  }

  find(cssSelector) {
    let result = this.el.find(cssSelector)
    if (result) {
      return _wrapNativeElement(result)
    } else {
      return null
    }
  }

  findAll(cssSelector) {
    let result = this.el.findAll(cssSelector).map(_wrapNativeElement)
    return result
  }

  _normalizeChild(child) {
    if (isString(child)) {
      child = this.createTextNode(child)
    }
    if (child._wrapper) {
      child = child._wrapper
    }
    if (!child || !child._isMemoryDOMElement) {
      throw new Error('Illegal argument: only String and MemoryDOMElement instances are valid.')
    }
    console.assert(child.el._wrapper === child, "Expecting a backlink between native element and MemoryDOMElement")
    return child.getNativeElement()
  }

  appendChild(child) {
    child = this._normalizeChild(child)
    this.el.appendChild(child)
    return this
  }

  insertAt(pos, child) {
    child = this._normalizeChild(child)
    this.el.insertAt(pos, child)
    return this
  }

  insertBefore(child, before) {
    let pos = this.el.children.indexOf(before.el)
    if (pos > -1) {
      return this.insertAt(pos, child)
    } else {
      throw new Error('insertBefore(): reference node is not a child of this element.')
    }
  }

  removeAt(pos) {
    if (pos < 0 || pos >= this.el.children.length) {
      throw new Error('removeAt(): Index out of bounds.')
    }
    this.el.removeAt(pos)
    // let child = this.el.children[pos]
    // child.parent = null
    // this.el.children.splice(pos, 1)
    return this
  }

  removeChild(child) {
    if (!child || !child._isMemoryDOMElement) {
      throw new Error('removeChild(): Illegal arguments. Expecting a MemoryDOMElement instance.')
    }
    let idx = this.el.children.indexOf(child.el)
    if (idx < 0) {
      throw new Error('removeChild(): element is not a child.')
    }
    this.removeAt(idx)
    return this
  }

  replaceChild(oldChild, newChild) {
    if (!newChild || !oldChild ||
        !newChild._isMemoryDOMElement || !oldChild._isMemoryDOMElement) {
      throw new Error('replaceChild(): Illegal arguments. Expecting BrowserDOMElement instances.')
    }
    let idx = this.el.children.indexOf(oldChild.el)
    if (idx > -1) {
      this.removeAt(idx)
      this.insertAt(idx, newChild.el)
    }
    return this
  }

  empty() {
    this.el.removeAllChildren()
    return this
  }

  remove() {
    this.el.remove()
    return this
  }

  _replaceNativeEl(newEl) {
    this.el.replaceWith(newEl)
    // NOTE: we need to retain the backlink
    this.el._wrapper = this
  }

  isInDocument() {
    let el = this.el
    while (el) {
      if (el === el.root) {
        return true
      }
      el = el.parent
    }
    return false
  }

  click() {
    this.emit('click')
  }

}

// TODO: instead we should allow to add and remove listeners
EventEmitter.mixin(MemoryDOMElement)

MemoryDOMElement.prototype._isMemoryDOMElement = true

MemoryDOMElement.createTextNode = function(text) {
  return MemoryDOMElement.wrapNativeElement(
    createTextNode(null, text)
  )
}

MemoryDOMElement.createElement = function(tagName) {
  return MemoryDOMElement.wrapNativeElement(
    createElement(null, tagName)
  )
}

MemoryDOMElement.parseMarkup = function(str, format) {
  let nativeEls = []
  let doc

  if (!str) {
    // Create an empty XML document
    if (format === 'xml') {
      doc = parseXML('')
    } else {
      doc = parseHTML('')
    }
    return new MemoryDOMElement(doc)
  } else {
    if (format === 'xml') {
      nativeEls = parseXML(str)
    } else {
      nativeEls = parseHTML(str)
    }
  }
  let elements = nativeEls.map(function(el) {
    return new MemoryDOMElement(el)
  });
  if (elements.length === 1) {
    return elements[0]
  } else {
    return elements
  }
}

MemoryDOMElement.wrapNativeElement = _wrapNativeElement

function _wrapNativeElement(el) {
  if (el._wrapper) {
    return el._wrapper
  } else {
    return new MemoryDOMElement(el)
  }
}


export default MemoryDOMElement
