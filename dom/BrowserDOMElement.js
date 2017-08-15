import { isString, isNumber, isNil, uuid } from '../util'
import DOMElement from './DOMElement'

// using a dynamic signature to store the wrapper on the native element
// this way, we avoid to inadvertently use a wrong API created by another
// DOMElement instance on the element
const SIGNATURE = uuid('_BrowserDOMElement')

function _attach(nativeEl, browserDOMElement) {
  nativeEl[SIGNATURE] = browserDOMElement
}

function _detach(nativeEl) {
  delete nativeEl[SIGNATURE]
}

function _unwrap(nativeEl) {
  return nativeEl[SIGNATURE]
}

export default
class BrowserDOMElement extends DOMElement {

  constructor(el) {
    super()
    console.assert(el instanceof window.Node, "Expecting native DOM node.")
    this.el = el
    // creating a backlink so we can move between the native DOM API and
    // the DOMElement API
    _attach(el, this)
  }

  getNativeElement() {
    return this.el
  }

  getNodeType() {
    switch(this.el.nodeType) {
      case window.Node.TEXT_NODE:
        return "text"
      case window.Node.ELEMENT_NODE:
        return 'element'
      case window.Node.DOCUMENT_NODE:
        return 'document'
      case window.Node.COMMENT_NODE:
        return 'comment'
      case window.Node.PROCESSING_INSTRUCTION_NODE:
        return 'directive'
      case window.Node.CDATA_SECTION_NODE:
        return 'cdata'
      default:
        //
    }
  }

  getDoctype() {
    if (this.isDocumentNode()) {
      return this.el.doctype
    } else {
      return this.getOwnerDocument().getDoctype()
    }
  }

  setDocType(qualifiedNameStr, publicId, systemId) {
    let ownerDocument = this._getNativeOwnerDocument()
    let oldDocType = ownerDocument.doctype
    let newDocType = ownerDocument.implementation.createDocumentType(
     qualifiedNameStr, publicId, systemId
    )
    if (oldDocType) {
      oldDocType.parentNode.replaceChild(newDocType, oldDocType)
    } else {
      ownerDocument.appendChild(newDocType)
    }
  }

  isTextNode() {
    return (this.el.nodeType === window.Node.TEXT_NODE)
  }

  isElementNode() {
    return (this.el.nodeType === window.Node.ELEMENT_NODE)
  }

  isCommentNode() {
    return (this.el.nodeType === window.Node.COMMENT_NODE)
  }

  isDocumentNode() {
    return (this.el.nodeType === window.Node.DOCUMENT_NODE)
  }

  hasClass(className) {
    return this.el.classList.contains(className)
  }

  addClass(className) {
    this.el.classList.add(className)
    return this
  }

  removeClass(className) {
    this.el.classList.remove(className)
    return this
  }

  getAttribute(name) {
    return this.el.getAttribute(name)
  }

  setAttribute(name, value) {
    this.el.setAttribute(name, String(value))
    return this
  }

  removeAttribute(name) {
    this.el.removeAttribute(name)
    return this
  }

  getAttributes() {
    if (!this.el.attributes._mapAdapter) {
      this.el.attributes._mapAdapter = new AttributesMapAdapter(this.el.attributes)
    }
    return this.el.attributes._mapAdapter
  }

  getProperty(name) {
    return this.el[name]
  }

  setProperty(name, value) {
    // ATTENTION: element properties are only used on HTML elements, such as the 'value' of an <input> element
    // In XML there are only attributes
    if (this._isXML()) throw new Error('setProperty() is only supported for HTML elements.')
    this.el[name] = value
    return this
  }

  getTagName() {
    // it is convenient in HTML mode to always use tagName in lower case
    // however, in XML this is not allowed, as tag names are case sensitive there
    if (this._isXML()) {
      return this.el.tagName
    } else if (this.el.tagName) {
      return this.el.tagName.toLowerCase()
    }
  }

  setTagName(tagName) {
    let newEl = this.createElement(tagName)
    let attributes = this.el.attributes
    let l = attributes.length
    let i
    for(i = 0; i < l; i++) {
      let attr = attributes.item(i)
      newEl.setAttribute(attr.name, attr.value)
    }
    if (this.eventListeners) {
      this.eventListeners.forEach(function(listener) {
        newEl.addEventListener(listener.eventName, listener.handler, listener.capture)
      })
    }
    newEl.append(this.getChildNodes())

    this._replaceNativeEl(newEl.getNativeElement())
    return this
  }

  getId() {
    return this.el.id
  }

  setId(id) {
    this.el.id = id
    return this
  }

  getStyle(name) {
    // NOTE: important to provide computed style, otherwise we don't get inherited styles
    let style = this.getComputedStyle()
    return style[name] || this.el.style[name]
  }

  getComputedStyle() {
    return window.getComputedStyle(this.el)
  }

  setStyle(name, value) {
    if (DOMElement.pxStyles[name] && isNumber(value)) value = value + 'px'
    this.el.style[name] = value
    return this
  }

  getTextContent() {
    return this.el.textContent
  }

  setTextContent(text) {
    this.el.textContent = text
    return this
  }

  getInnerHTML() {
    if (this._isXML()) {
      let xs = new window.XMLSerializer()
      let result = Array.prototype.map.call(this.el.childNodes, c => xs.serializeToString(c))
      return result.join('')
    } else {
      return this.el.innerHTML
    }
  }

  setInnerHTML(html) {
    // TODO: if in some cases we need to use XMLSerializer to get the innerHTML
    // then we probably need to use DOMParser here accordingly
    this.el.innerHTML = html
    return this
  }

  getOuterHTML() {
    // NOTE: this was necessary in some browsers, which did not provide
    // el.outerHTML for XML elements
    if (this._isXML()) {
      let xs = new window.XMLSerializer()
      return xs.serializeToString(this.el)
    } else {
      return this.el.outerHTML
    }
  }

  _addEventListenerNative(listener) {
    this.el.addEventListener(listener.eventName, listener.handler, listener.capture)
  }

  _removeEventListenerNative(listener) {
    this.el.removeEventListener(listener.eventName, listener.handler)
  }

  getEventListeners() {
    return this.eventListeners || []
  }

  getChildCount() {
    return this.el.childNodes.length
  }

  getChildNodes() {
    let childNodes = []
    for (let node = this.el.firstChild; node; node = node.nextSibling) {
      childNodes.push(BrowserDOMElement.wrap(node))
    }
    return childNodes
  }

  get childNodes() {
    return this.getChildNodes()
  }

  getChildren() {
    // Some browsers don't filter elements here and also include text nodes,
    // that why we can't use el.children
    let children = [];
    for (let node = this.el.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === window.Node.ELEMENT_NODE) {
        children.push(BrowserDOMElement.wrap(node))
      }
    }
    return children
  }

  get children() {
    return this.getChildren()
  }

  getChildAt(pos) {
    return BrowserDOMElement.wrap(this.el.childNodes[pos])
  }

  getChildIndex(child) {
    /* istanbul ignore next */
    if (!child._isBrowserDOMElement) {
      throw new Error('Expecting a BrowserDOMElement instance.')
    }
    return Array.prototype.indexOf.call(this.el.childNodes, child.el)
  }

  getFirstChild() {
    let firstChild = this.el.firstChild
    /* istanbul ignore else */
    if (firstChild) {
      return BrowserDOMElement.wrap(firstChild)
    } else {
      return null
    }
  }

  getLastChild() {
    var lastChild = this.el.lastChild
    /* istanbul ignore else */
    if (lastChild) {
      return BrowserDOMElement.wrap(lastChild)
    } else {
      return null
    }
  }

  getNextSibling() {
    let next = this.el.nextSibling
    /* istanbul ignore else */
    if (next) {
      return BrowserDOMElement.wrap(next)
    } else {
      return null
    }
  }

  getPreviousSibling() {
    let previous = this.el.previousSibling
    /* istanbul ignore else */
    if (previous) {
      return BrowserDOMElement.wrap(previous)
    } else {
      return null
    }
  }

  clone(deep) {
    let clone = this.el.cloneNode(deep)
    return BrowserDOMElement.wrap(clone)
  }

  createDocument(format) {
    return BrowserDOMElement.createDocument(format)
  }

  createElement(tagName) {
    let doc = this._getNativeOwnerDocument()
    let el = doc.createElement(tagName)
    return BrowserDOMElement.wrap(el)
  }

  createTextNode(text) {
    let doc = this._getNativeOwnerDocument()
    let el = doc.createTextNode(text)
    return BrowserDOMElement.wrap(el)
  }

  createComment(data) {
    let doc = this._getNativeOwnerDocument()
    let el = doc.createComment(data)
    return BrowserDOMElement.wrap(el)
  }

  createProcessingInstruction(name, data) {
    let doc = this._getNativeOwnerDocument()
    let el = doc.createProcessingInstruction(name, data)
    return BrowserDOMElement.wrap(el)
  }

  createCDATASection(data) {
    let doc = this._getNativeOwnerDocument()
    let el = doc.createCDATASection(data)
    return BrowserDOMElement.wrap(el)
  }

  is(cssSelector) {
    // ATTENTION: looking at https://developer.mozilla.org/en/docs/Web/API/Element/matches
    // Element.matches might not be supported by some mobile browsers
    let el = this.el
    /* istanbul ignore else */
    if (this.isElementNode()) {
      return matches(el, cssSelector)
    } else {
      return false
    }
  }

  getParent() {
    let parent = this.el.parentNode
    /* istanbul ignore else */
    if (parent) {
      return BrowserDOMElement.wrap(parent)
    } else {
      return null
    }
  }

  getOwnerDocument() {
    return BrowserDOMElement.wrap(this._getNativeOwnerDocument())
  }

  get ownerDocument() {
    return this.getOwnerDocument()
  }

  _getNativeOwnerDocument() {
    return (this.isDocumentNode() ? this.el : this.el.ownerDocument)
  }

  find(cssSelector) {
    let result = null
    if (this.el.querySelector) {
      result = this.el.querySelector(cssSelector)
    }
    if (result) {
      return BrowserDOMElement.wrap(result)
    } else {
      return null
    }
  }

  findAll(cssSelector) {
    let result = []
    if (this.el.querySelectorAll) {
      result = this.el.querySelectorAll(cssSelector)
    }
    return Array.prototype.map.call(result, function(el) {
      return BrowserDOMElement.wrap(el)
    })
  }

  _normalizeChild(child) {
    if (isNil(child)) return child

    if (child instanceof window.Node) {
      child = BrowserDOMElement.wrap(child)
    }
    // Note: element is owned by a different implementation.
    // Probably you are using two different versions of Substance on the same element.
    // Can't tell if this is bad. For now we continue by wrapping it again
    else if (child._isBrowserDOMElement && ! (child instanceof BrowserDOMElement)) {
      child = BrowserDOMElement.wrap(child)
    } else if (isString(child) || isNumber(child)) {
      child = this.createTextNode(child)
    }
    /* istanbul ignore next */
    if (!child || !child._isBrowserDOMElement) {
      throw new Error('Illegal child type.')
    }
    console.assert(_unwrap(child.el) === child, "The backlink to the wrapper should be consistent")
    return child.getNativeElement()
  }

  appendChild(child) {
    let nativeChild = this._normalizeChild(child)
    if (nativeChild) {
      this.el.appendChild(nativeChild)
    }
    return this
  }

  insertAt(pos, child) {
    let nativeChild = this._normalizeChild(child)
    let childNodes = this.el.childNodes
    if (pos >= childNodes.length) {
      this.el.appendChild(nativeChild)
    } else {
      this.el.insertBefore(nativeChild, childNodes[pos])
    }
    return this
  }

  insertBefore(child, before) {
    /* istanbul ignore next */
    if (isNil(before)) {
      return this.appendChild(child)
    }
    if (!before._isBrowserDOMElement) {
      throw new Error('insertBefore(): Illegal arguments. "before" must be a BrowserDOMElement instance.')
    }
    var nativeChild = this._normalizeChild(child)
    if (nativeChild) {
      this.el.insertBefore(nativeChild, before.el)
    }
    return this
  }

  removeAt(pos) {
    this.el.removeChild(this.el.childNodes[pos])
    return this;
  }

  removeChild(child) {
    /* istanbul ignore next */
    if (!child || !child._isBrowserDOMElement) {
      throw new Error('removeChild(): Illegal arguments. Expecting a BrowserDOMElement instance.')
    }
    this.el.removeChild(child.el)
    return this
  }

  replaceChild(oldChild, newChild) {
    /* istanbul ignore next */
    if (!newChild || !oldChild ||
        !newChild._isBrowserDOMElement || !oldChild._isBrowserDOMElement) {
      throw new Error('replaceChild(): Illegal arguments. Expecting BrowserDOMElement instances.')
    }
    // Attention: Node.replaceChild has weird semantics
    this.el.replaceChild(newChild.el, oldChild.el)
    return this
  }

  empty() {
    let el = this.el
    while (el.lastChild) {
      el.removeChild(el.lastChild)
    }
    return this
  }

  remove() {
    if (this.el.parentNode) {
      this.el.parentNode.removeChild(this.el)
    }
    return this
  }

  serialize() {
    let outerHTML = this.el.outerHTML
    if (isString(outerHTML)) {
      return outerHTML
    } else {
      let xs = new window.XMLSerializer()
      return xs.serializeToString(this.el)
    }
  }

  isInDocument() {
    let el = this.el
    while(el) {
      if (el.nodeType === window.Node.DOCUMENT_NODE) {
        return true
      }
      el = el.parentNode
    }
  }

  _replaceNativeEl(newEl) {
    console.assert(newEl instanceof window.Node, "Expecting a native element.")
    let oldEl = this.el
    let parentNode = oldEl.parentNode
    if (parentNode) {
      parentNode.replaceChild(newEl, oldEl)
    }
    this.el = newEl
    _detach(oldEl)
    _attach(newEl, this)
  }

  _getChildNodeCount() {
    return this.el.childNodes.length
  }

  focus() {
    this.el.focus()
    return this
  }

  select() {
    this.el.select()
    return this
  }


  blur() {
    this.el.focus()
    return this
  }

  click() {
    this.el.click()
    return this
  }

  getWidth() {
    let rect = this.el.getClientRects()[0]
    if (rect) {
      return rect.width
    } else {
      return 0
    }
  }

  getHeight() {
    let rect = this.el.getClientRects()[0]
    if (rect) {
      return rect.height
    } else {
      return 0
    }
  }

  getOffset() {
    let rect = this.el.getBoundingClientRect()
    return {
      top: rect.top + document.body.scrollTop,
      left: rect.left + document.body.scrollLeft
    }
  }

  getPosition() {
    return {left: this.el.offsetLeft, top: this.el.offsetTop}
  }

  getOuterHeight(withMargin) {
    let outerHeight = this.el.offsetHeight
    if (withMargin) {
      let style = this.getComputedStyle()
      outerHeight += parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10)
    }
    return outerHeight
  }

  getContentType() {
    return this._getNativeOwnerDocument().contentType
  }

  _isXML() {
    return this.getContentType() === 'application/xml'
  }

  emit(name, data) {
    let event
    if (data) {
      event = new window.CustomEvent(name, {
        detail: data,
        bubbles: true,
        cancelable: true
      })
    } else {
      event = new window.Event(name, {
        bubbles: true,
        cancelable: true
      })
    }
    this.el.dispatchEvent(event)
  }
}

BrowserDOMElement.prototype._isBrowserDOMElement = true

// TODO: flesh out how options should look like (e.g. XML namespaceURI etc.)
BrowserDOMElement.createDocument = function(format) {
  let doc
  if (format === 'xml') {
    // HACK: didn't find a way to create an empty XML doc without a root element
    doc = window.document.implementation.createDocument(null, 'dummy')
    // remove the
    doc.removeChild(doc.firstChild)
  } else {
    doc = (new window.DOMParser()).parseFromString(DOMElement.EMPTY_HTML, 'text/html')
  }
  return BrowserDOMElement.wrap(doc)
}

BrowserDOMElement.parseMarkup = function(str, format, options={}) {
  if (!str) {
    return BrowserDOMElement.createDocument(format)
  }
  if (options.snippet) {
    str = `<div id='__snippet__'>${str}</div>`
  }
  let doc
  let parser = new window.DOMParser()
  if (format === 'html') {
    doc = BrowserDOMElement.wrap(
      _check(
        parser.parseFromString(str, 'text/html')
      )
    )
  } else if (format === 'xml') {
    doc = BrowserDOMElement.wrap(
      _check(
        parser.parseFromString(str, 'application/xml')
      )
    )
  }
  if (options.snippet) {
    let childNodes = doc.find('#__snippet__').childNodes
    if (childNodes.length === 1) {
      return childNodes[0]
    } else {
      return childNodes
    }
  } else {
    return doc
  }

  function _check(doc) {
    if (doc) {
      let parserError = doc.querySelector('parsererror')
      if (parserError) {
        throw new Error("ParserError: " + parserError)
      }
    }
    return doc
  }
}

BrowserDOMElement.wrap =
BrowserDOMElement.wrapNativeElement = function(el) {
  if (el) {
    let _el = _unwrap(el)
    if (_el) {
      return _el
    } else if (el instanceof window.Node) {
      return new BrowserDOMElement(el)
    } else if (el._isBrowserDOMElement) {
      return new BrowserDOMElement(el.getNativeElement())
    } else if (el === window) {
      return BrowserDOMElement.getBrowserWindow()
    }
  } else {
    return null
  }
}

BrowserDOMElement.unwrap = function(nativeEl) {
  return _unwrap(nativeEl)
}

/*
  Wrapper for the window element exposing DOMElement's EventListener API.
*/
class BrowserWindow {

  constructor() {
    // Note: not
    this.el = window
    window.__BrowserDOMElementWrapper__ = this
  }

}

BrowserWindow.prototype.on = BrowserDOMElement.prototype.on
BrowserWindow.prototype.off = BrowserDOMElement.prototype.off
BrowserWindow.prototype.addEventListener = BrowserDOMElement.prototype.addEventListener
BrowserWindow.prototype.removeEventListener = BrowserDOMElement.prototype.removeEventListener
BrowserWindow.prototype._createEventListener = BrowserDOMElement.prototype._createEventListener
BrowserWindow.prototype._addEventListenerNative = BrowserDOMElement.prototype._addEventListenerNative
BrowserWindow.prototype._removeEventListenerNative = BrowserDOMElement.prototype._removeEventListenerNative

BrowserWindow.prototype.getEventListeners = BrowserDOMElement.prototype.getEventListeners

BrowserDOMElement.getBrowserWindow = function() {
  if (window[SIGNATURE]) return window[SIGNATURE]
  return new BrowserWindow(window)
}

BrowserDOMElement.isReverse = function(anchorNode, anchorOffset, focusNode, focusOffset) {
  // the selection is reversed when the focus propertyEl is before
  // the anchor el or the computed charPos is in reverse order
  if (focusNode && anchorNode) {
    if (!BrowserDOMElement.isReverse._r1) {
      BrowserDOMElement.isReverse._r1 = window.document.createRange()
      BrowserDOMElement.isReverse._r2 = window.document.createRange()
    }
    const _r1 = BrowserDOMElement.isReverse._r1
    const _r2 = BrowserDOMElement.isReverse._r2
    _r1.setStart(anchorNode.getNativeElement(), anchorOffset)
    _r2.setStart(focusNode.getNativeElement(), focusOffset)
    let cmp = _r1.compareBoundaryPoints(window.Range.START_TO_START, _r2)
    if (cmp === 1) {
      return true
    }
  }
  return false
}

BrowserDOMElement.getWindowSelection = function() {
  let nativeSel = window.getSelection()
  let result = {
    anchorNode: BrowserDOMElement.wrap(nativeSel.anchorNode),
    anchorOffset: nativeSel.anchorOffset,
    focusNode: BrowserDOMElement.wrap(nativeSel.focusNode),
    focusOffset: nativeSel.focusOffset
  }
  return result
}


function matches(el, selector) {
  let elProto = window.Element.prototype
  let _matches = (
    elProto.matches || elProto.matchesSelector ||
    elProto.msMatchesSelector || elProto.webkitMatchesSelector
  )
  return _matches.call(el, selector)
}

class AttributesMapAdapter {

  constructor(attributes) {
    this.attributes = attributes
  }

  get size() {
    return this.attributes.length
  }

  get(name) {
    let item = this.attributes.getNamedItem(name)
    if (item) {
      return item.value
    }
  }

  set(name, value) {
    this.attributes.setNamedItem(name, value)
  }

  forEach(fn) {
    const S = this.size
    for (let i = 0; i < S; i++) {
      const item = this.attributes.item(i)
      fn(item.value, item.name)
    }
  }

  map(fn) {
    let result = []
    this.forEach((val, key)=>{ result.push(fn(val, key)) })
    return result
  }

  keys() {
    return this.map((val, key)=>{ return key })
  }

  values() {
    return this.map((val)=>{ return val })
  }

  entries() {
    return this.map((val, key)=>{ return [key, val] })
  }

}
