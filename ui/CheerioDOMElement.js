import isString from 'lodash/isString'
import last from 'lodash/last'
import extend from 'lodash/extend'
import clone from 'lodash/clone'
import map from 'lodash/map'
import $ from 'substance-cheerio'
import EventEmitter from '../util/EventEmitter'
import DOMElement from './DOMElement'

class CheerioDOMElement extends DOMElement {

  constructor(el) {
    super()
    EventEmitter.call(this)

    this.el = el
    this.$el = $(el)
    el._wrapper = this
    this.htmlProps = {}
  }

  get _isCheerioDOMElement() {
    return true
  }

  getNativeElement() {
    return this.el
  }

  _wrapNativeElement(el) {
    if (el._wrapper) {
      return el._wrapper
    } else {
      return new CheerioDOMElement(el)
    }
  }

  hasClass(className) {
    return this.$el.hasClass(className)
  }

  addClass(className) {
    this.$el.addClass(className)
    return this
  }

  removeClass(className) {
    this.$el.removeClass(className)
    return this
  }

  getClasses() {
    return this.$el.attr('class')
  }

  setClasses(classString) {
    this.$el.attr('class', classString)
    return this
  }

  getAttribute(name) {
    return this.$el.attr(name)
  }

  setAttribute(name, value) {
    this.$el.attr(name, value)
    return this
  }

  removeAttribute(name) {
    this.$el.removeAttr(name)
    return this
  }

  getAttributes() {
    let attributes = clone(this.el.attribs)
    return attributes
  }

  getProperty(name) {
    return this.$el.prop(name)
  }

  setProperty(name, value) {
    this.htmlProps[name] = value
    this.$el.prop(name, value)
    return this
  }

  // TODO: verify that this.el[name] is correct
  removeProperty(name) {
    delete this.htmlProps[name]
    delete this.el[name]
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
    let newEl = $._createElement(tagName, this.el.root)
    let $newEl = $(newEl)
    $newEl.html(this.$el.html())
    newEl.attribs = extend({}, this.el.attribs)
    this._replaceNativeEl(newEl)
    return this
  }

  getId() {
    return this.$el.attr('id')
  }

  setId(id) {
    this.$el.attr('id', id)
    return this
  }

  getTextContent() {
    return this.$el.text()
  }

  setTextContent(text) {
    this.$el.text(text)
    return this
  }

  getInnerHTML() {
    return this.$el.html()
  }

  setInnerHTML(html) {
    this.$el.html(html)
    return this
  }

  getOuterHTML() {
    // TODO: this is not really jquery
    return $._serialize(this.el)
  }

  getValue() {
    return this.$el.val()
  }

  setValue(value) {
    this.$el.val(value)
    return this
  }

  getStyle(name) {
    return this.$el.css(name)
  }

  setStyle(name, value) {
    this.$el.css(name, value)
    return this
  }

  addEventListener() {
    return this
  }

  removeEventListener() {
    return this
  }

  removeAllEventListeners() {
    return this
  }

  getEventListeners() {
    return []
  }

  getChildCount() {
    return this.el.children.length
  }

  getChildNodes() {
    let childNodes = this.el.children
    childNodes = childNodes.map(function(node) {
      return this._wrapNativeElement(node)
    }.bind(this))
    return childNodes
  }

  getChildren() {
    let children = this.el.children
    children = children.filter(function(node) {
      return node.type === "tag"
    })
    children = children.map(function(node) {
      return this._wrapNativeElement(node)
    }.bind(this))
    return children
  }

  getChildAt(pos) {
    return this._wrapNativeElement(this.el.children[pos])
  }

  getChildIndex(child) {
    if (!child._isCheerioDOMElement) {
      throw new Error('Expecting a CheerioDOMElement instance.')
    }
    return this.el.children.indexOf(child.el)
  }

  getFirstChild() {
    let firstChild = this.el.children[0]
    if (firstChild) {
      return CheerioDOMElement.wrapNativeElement(firstChild)
    } else {
      return null
    }
  }

  getLastChild() {
    let lastChild = last(this.el.children)
    if (lastChild) {
      return CheerioDOMElement.wrapNativeElement(lastChild)
    } else {
      return null
    }
  }

  getNextSibling() {
    var next = this.el.next;
    if (next) {
      return CheerioDOMElement.wrapNativeElement(next)
    } else {
      return null
    }
  }

  getPreviousSibling() {
    let previous = this.el.previous
    if (previous) {
      return CheerioDOMElement.wrapNativeElement(previous)
    } else {
      return null
    }
  }

  isTextNode() {
    // cheerio specific
    return this.el.type === "text"
  }

  isElementNode() {
    // cheerio specific
    return this.el.type === "tag" || this.el.type === "script"
  }

  isCommentNode() {
    // cheerio specific
    return this.el.type === "comment"
  }

  isDocumentNode() {
    return this.el === this.el.root
  }

  clone() {
    let clone = this.$el.clone()[0]
    return this._wrapNativeElement(clone)
  }

  createElement(tagName) {
    let el = $._createElement(tagName, this.el.root)
    return this._wrapNativeElement(el)
  }

  createTextNode(text) {
    let el = $._createTextNode(text)
    return this._wrapNativeElement(el)
  }

  is(cssSelector) {
    // Note: unfortunately there is no cross-browser supported selectr matcher
    // Element.matches is not supported by all (mobile) browsers
    return this.$el.is(cssSelector)
  }

  getParent() {
    let parent = this.el.parent
    if (parent) {
      return this._wrapNativeElement(parent)
    } else {
      return null
    }
  }

  getRoot() {
    let el = this.el
    let parent = el
    while (parent) {
      el = parent
      parent = el.parent
    }
    return this._wrapNativeElement(el)
  }

  find(cssSelector) {
    let result = this.$el.find(cssSelector)
    if (result.length > 0) {
      return this._wrapNativeElement(result[0])
    } else {
      return null
    }
  }

  findAll(cssSelector) {
    let result = this.$el.find(cssSelector)
    if (result.length > 0) {
      return map(result, function(el) {
        return this._wrapNativeElement(el)
      }.bind(this))
    } else {
      return []
    }
  }

  _normalizeChild(child) {
    if (isString(child)) {
      child = this.createTextNode(child)
    }
    if (child._wrapper) {
      child = child._wrapper
    }
    if (!child || !child._isCheerioDOMElement) {
      throw new Error('Illegal argument: only String and CheerioDOMElement instances are valid.')
    }
    console.assert(child.el._wrapper === child, "Expecting a backlink between native element and CheerioDOMElement")
    return child.getNativeElement()
  }

  appendChild(child) {
    child = this._normalizeChild(child)
    this.el.children.push(child)
    child.parent = this.el
    return this
  }

  insertAt(pos, child) {
    child = this._normalizeChild(child)
    let children = this.el.children
    // NOTE: manipulating cheerio's internal children array
    // as otherwise cheerio clones the element loosing our custom data
    if (pos >= children.length) {
      children.push(child)
    } else {
      children.splice(pos, 0, child)
    }
    child.parent = this.el
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
    // NOTE: again manipulating cheerio's internal children array --
    // it works.
    let child = this.el.children[pos]
    child.parent = null
    this.el.children.splice(pos, 1)
    return this
  }

  removeChild(child) {
    if (!child || !child._isCheerioDOMElement) {
      throw new Error('removeChild(): Illegal arguments. Expecting a CheerioDOMElement instance.')
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
        !newChild._isCheerioDOMElement || !oldChild._isCheerioDOMElement) {
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
    this.$el.empty()
    return this
  }

  remove() {
    this.$el.remove()
    return this
  }

  _replaceNativeEl(newEl) {
    let $newEl = $(newEl)
    this.$el.replaceWith($newEl)
    this.el = newEl
    this.$el = $newEl
    // HACK: we need the correct backlink
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

EventEmitter.mixin(CheerioDOMElement)

DOMElement._defineProperties(CheerioDOMElement, DOMElement._propertyNames);

CheerioDOMElement.createTextNode = function(text) {
  return CheerioDOMElement.wrapNativeElement(
    $._createTextNode(text)
  )
}

CheerioDOMElement.createElement = function(tagName) {
  return CheerioDOMElement.wrapNativeElement(
    $('<' + tagName + '>')[0]
  )
}

CheerioDOMElement.parseMarkup = function(str, format) {
  let nativeEls = []
  let doc;

  if (!str) {
    // Create an empty XML document
    if (format === 'xml') {
      doc = $.parseXML('')
    } else {
      doc = $.parseHTML('')
    }
    return new CheerioDOMElement(doc)
  } else {
    if (format === 'xml') {
      nativeEls = $.parseXML(str)
    } else {
      nativeEls = $.parseHTML(str)
    }
  }
  let elements = nativeEls.map(function(el) {
    return new CheerioDOMElement(el)
  });
  if (elements.length === 1) {
    return elements[0]
  } else {
    return elements
  }
}

CheerioDOMElement.wrapNativeElement = function(el) {
  if (el._wrapper) {
    return el._wrapper
  } else {
    return new CheerioDOMElement(el)
  }
}

export default CheerioDOMElement
