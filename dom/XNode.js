import { cssSelect, domSerializer, DomUtils, ElementType } from './vendor'
import parseMarkup from './parseMarkup'
import DOMEventListener from './DOMEventListener'
import DOMElement from './DOMElement'
import last from '../util/last'
import isString from '../util/isString'
import isNil from '../util/isNil'

class XNode extends DOMElement {

  constructor(type, args = {}) {
    super()

    this.type = type
    if (!type) throw new Error("'type' is mandatory")

    if (args.ownerDocument) this.ownerDocument = args.ownerDocument

    switch(type) {
      case ElementType.Tag: {
        this.name = args.name
        if (!this.name) throw new Error("'name' is mandatory.")
        this.attribs = _attribs(this)
        this.classes = new Set()
        this.styles = new Map()
        this.htmlProps = new Map()
        this.eventListeners = []
        this.children = []
        this.assign(args)
        break
      }
      case ElementType.Text:
      case ElementType.Comment: {
        this.data = args.data || ''
        break
      }
      case ElementType.CDATA: {
        this.children = args.children || []
        break
      }
      case ElementType.Directive: {
        this.name = args.name
        this.data = args.data
        break
      }
      case 'document': {
        this.format = args.format
        break
      }
      case 'component': {
        this.attribs = _attribs(this)
        this.classes = new Set()
        this.styles = new Map()
        this.htmlProps = new Map()
        this.eventListeners = []
        this.assign(args)
        break
      }
      default:
        //
    }
  }

  clone(deep) {
    let clone = new XNode(this.type, this)
    if (deep && this.children) {
      this.children.forEach((child) => {
        clone.appendChild(child.clone(deep))
      })
    }
    return clone
  }

  getTagName() {
    if (this.name) {
      return this.name.toLowerCase()
    }
  }

  setTagName(tagName) {
    this.name = tagName
    return this
  }

  getAttribute(name) {
    if (this.attribs) {
      return this.attribs[name]
    }
  }

  setAttribute(name, value) {
    if (this.attribs) {
      this.attribs[name] = value
    }
    return this
  }

  removeAttribute(name) {
    if (this.attribs) {
      delete this.attribs[name]
    }
    return this
  }

  getAttributes() {
    return this.attribs
  }

  getProperty(name) {
    if (this.htmlProps) {
      return this.htmlProps[name]
    }
  }

  setProperty(name, value) {
    if (this.htmlProps) {
      this.htmlProps[name] = value
    }
    return this
  }

  removeProperty(name) {
    if (this.htmlProps && this.htmlProps.hasOwnProperty(name)) {
      delete this.htmlProps[name]
    }
    return this
  }

  hasClass(name) {
    if (this.classes) {
      return this.classes.has(name)
    }
    return this
  }

  addClass(name) {
    if (this.classes) {
      this.classes.add(name)
    }
    return this
  }

  removeClass(name) {
    if (this.classes) {
      this.classes.delete(name)
    }
    return this
  }

  getInnerHTML() {
    return DomUtils.getInnerHTML(this)
  }

  // TODO: parse html using settings from el,
  // clear old children and append new children
  setInnerHTML(html) {
    if (this.children) {
      let opts = {}
      if (this.ownerDocument) opts.ownerDocument = this.ownerDocument
      else opts.format = 'html'
      let children = parseMarkup(html, opts)
      this.empty()
      children.forEach((child) => {
        this.appendChild(child)
      })
    }
    return this
  }

  getOuterHTML() {
    return domSerializer(this)
  }

  getTextContent() {
    return DomUtils.getText(this)
  }

  setTextContent(text) {
    if (this.type === 'text') {
      this.data = text
    } else if (this.children) {
      let child = this.createTextNode(text)
      this.empty()
      this.appendChild(child)
    }
    return this
  }

  getValue() {
    return this.data
  }

  setValue(value) {
    this.data = value
    return this
  }

  getStyle(name) {
    if (this.styles) {
      return this.styles[name]
    }
  }

  setStyle(name, value) {
    if (this.styles) {
      this.styles[name] = value
    }
    return this
  }

  is(cssSelector) {
    return cssSelect.is(this, cssSelector)
  }

  find(cssSelector) {
    return cssSelect.selectOne(cssSelector, this)
  }

  findAll(cssSelector) {
    return cssSelect.selectAll(cssSelector, this)
  }

  getChildCount() {
    if (this.children) {
      return this.children.length
    } else {
      return 0
    }
  }

  getChildNodes() {
    let childNodes = this.children
    return childNodes
  }

  getChildren() {
    let children = this.children
    children = children.filter(function(node) {
      return node.type === "tag"
    })
    return children
  }

  getChildAt(pos) {
    if (this.children) {
      return this.children[pos]
    }
  }

  getChildIndex(child) {
    if (this.children) {
      return this.children.indexOf(child)
    }
  }

  getLastChild() {
    if (this.children) {
      return last(this.children)
    }
  }

  getFirstChild() {
    if (this.children) {
      return this.children[0]
    }
  }

  getNextSibling() {
    return this.next
  }

  getPreviousSibling() {
    return this.prev
  }

  getParent() {
    return this.parent
  }

  getRoot() {
    let el = this
    while (el.parent) el = el.parent
    return el
  }

  isTextNode() {
    return this.type === "text"
  }

  isElementNode() {
    return this.type === "tag" || this.type === "script"
  }

  isCommentNode() {
    return this.type === "comment"
  }

  isDocumentNode() {
    return this.type === "document"
  }

  createElement(tagName) {
    return new XNode('tag', { name: tagName, ownerDocument: this.ownerDocument })
  }

  createTextNode(text) {
    return new XNode('text', { data: text, ownerDocument: this.ownerDocument })
  }

  appendChild(child) {
    if (this.children && !isNil(child)) {
      child = this._normalizeChild(child)
      if (!child) return this
      DomUtils.appendChild(this, child)
      this._onAttach(child)
    }
    return this
  }

  insertAt(pos, child) {
    child = this._normalizeChild(child)
    if (!child) return this
    let children = this.children
    if (children) {
      // NOTE: manipulating htmlparser's internal children array
      if (pos >= children.length) {
        this.appendChild(child)
      } else {
        DomUtils.prepend(children[pos], child)
      }
      this._onAttach(child)
    }
    return this
  }

  insertBefore(newChild, before) {
    if (this.children) {
      var pos = this.children.indexOf(before)
      if (pos > -1) {
        DomUtils.prepend(before, newChild)
      } else {
        throw new Error('insertBefore(): reference node is not a child of this element.')
      }
      this._onAttach(newChild)
    }
    return this
  }

  removeAt(pos) {
    let children = this.children
    if (children) {
      let child = children[pos]
      child.remove()
      this._onDetach(child)
    }
    return this
  }

  empty() {
    let children = this.children
    if (children) {
      children.forEach((child) => {
        child.next = child.prev = child.parent = null
        this._onDetach(child)
      })
      children.length = 0
    }
    return this
  }

  remove() {
    let parent = this.parent
    DomUtils.removeElement(this)
    if (parent) {
      parent._onDetach(this)
    }
    return this
  }

  replaceChild(oldChild, newChild) {
    if (oldChild.parent === this) {
      oldChild.replaceWith(newChild)
    }
    return this
  }

  replaceWith(newEl) {
    let parent = this.parent
    newEl = this._normalizeChild(newEl)
    DomUtils.replaceElement(this, newEl)
    if (parent) {
      parent._onDetach(newEl)
      parent._onAttach(newEl)
    }
    return this
  }

  getEventListeners() {
    return this.eventListeners
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

  removeAllEventListeners() {
    this.eventListeners = []
    return this
  }

  assign(other) {
    if (this.classes && other.classes) {
      other.classes.forEach((val) => {
        this.classes.add(val)
      })
    }
    if (this.attribs && other.attribs) {
      Object.assign(this.attribs, other.attribs)
    }
    if (this.htmlProps && other.htmlProps) {
      Object.assign(this.htmlProps, other.htmlProps)
    }
    if (this.styles && other.styles) {
      Object.assign(this.styles, other.styles)
    }
    if (this.eventListeners && other.eventListeners) {
      this.eventListeners = this.eventListeners.concat(other.eventListeners)
    }
  }

  data() {
    let copy = {
      attribs: Object.assign({}, this.attribs),
    }
    if (this.classes && this.classes.length > 0) {
      copy.classes = new Set(this.classes)
    }
    if (this.styles) {
      copy.styles = new Map(this.styles)
    }
    if (this.htmlProps) {
      copy.htmlProps = new Map(this.htmlProps)
    }
    if (this.eventListeners) {
      copy.eventListeners = this.eventListeners.map((l) => {
        return l.clone()
      })
    }
    return copy
  }

  _onAttach(child) {} // eslint-disable-line no-unused-vars

  _onDetach(child) {} // eslint-disable-line no-unused-vars

  _normalizeChild(child) {
    if (isString(child)) {
      child = this.createTextNode(child)
    }
    if (!child || !child._isXNode) {
      throw new Error('Illegal argument: only String and XNode instances are valid.')
    }
    return child
  }

  _attach(child) {
    child.parent = this
  }

  _detach(child) {
    child.parent = null
  }

}

XNode.prototype._isXNode = true

XNode.createTextNode = function(text, ownerDocument) {
  return new XNode(ElementType.Text, {
    data: text,
    ownerDocument: ownerDocument
  })
}

XNode.createElement = function(tagName, ownerDocument) {
  return new XNode(ElementType.Tag, {
    name: tagName,
    ownerDocument: ownerDocument
  })
}

XNode.parseMarkup = function(str, format) {
  let elements = []
  if (!str) {
    return new XNode('document', {
      format: format
    })
  } else {
    elements = parseMarkup(str, { format: format })
  }
  if (elements.length === 1) {
    return elements[0]
  } else {
    return elements
  }
}

XNode.parseHTML = function(html, isFullDoc) {
  return XNode.parseMarkup(html, 'html', isFullDoc)
}

XNode.parseXML = function(html, isFullDoc) {
  return XNode.parseMarkup(html, 'xml', isFullDoc)
}

XNode.wrapNativeElement = function(el) {
  if (!el._isXNode) throw new Error('Illegal argument: expected XNode instance')
  return el
}

function parseClasses(classNames) {
  return new Set(classNames.split(/\s+/))
}

function stringifyClasses(classes) {
  return Array.from(classes).join(' ')
}

function parseStyles(styles) {
  styles = (styles || '').trim()
  if (!styles) return {}
  return styles
    .split(';')
    .reduce(function(obj, str){
      var n = str.indexOf(':')
      // skip if there is no :, or if it is the first/last character
      if (n < 1 || n === str.length-1) return obj
      obj[str.slice(0,n).trim()] = str.slice(n+1).trim()
      return obj
    }, new Map())
}

function stringifyStyles(styles) {
  if (!styles) return ''
  let str = Object.keys(styles).map((name) => {
    return name + ':' + styles[name]
  }).join(';')
  if (str.length > 0) str += ';'
  return str
}

function _attribs(self) {
  return {
    get class() {
      return stringifyClasses(self.classes)
    },
    set class(classNames) {
      self.classes = parseClasses(classNames)
    },
    get style() {
      return stringifyStyles(self.styles)
    },
    set style(style) {
      self.styles = parseStyles(style)
    }
  }
}

export default XNode