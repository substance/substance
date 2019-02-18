import forEach from '../util/forEach'
import isString from '../util/isString'
import isNil from '../util/isNil'
import isNumber from '../util/isNumber'
import last from '../util/last'
import inBrowser from '../util/inBrowser'
import ElementType from 'domelementtype'
import cssSelect from '../vendor/css-select'
import DomUtils from '../vendor/domutils'
import DOMElement from './DOMElement'
import parseMarkup from './parseMarkup'

// Singleton for browser window stub
let _browserWindowStub

export default class MemoryDOMElement extends DOMElement {
  constructor (type, args = {}) {
    super()

    this.type = type
    if (!type) throw new Error("'type' is mandatory")

    this.ownerDocument = args.ownerDocument
    /* istanbul ignore next */
    if (type !== 'document' && !this.ownerDocument) {
      throw new Error("'ownerDocument' is mandatory")
    }

    // NOTE: there are some properties which are named so that this
    // can be used together with htmlparser2 and css-select
    // but which could have a better naming, e.g., name -> tagName

    switch (type) {
      case ElementType.Tag: {
        if (!args.name) throw new Error("'name' is mandatory.")
        this.name = this._normalizeName(args.name)
        this.nameWithoutNS = nameWithoutNS(this.name)
        this.properties = new Map()
        this.attributes = new Map()
        this.classes = new Set()
        this.styles = new Map()
        this.eventListeners = []
        this.childNodes = args.children || args.childNodes || []
        this._assign(args)
        break
      }
      case ElementType.Text:
      case ElementType.Comment: {
        this.data = args.data || ''
        break
      }
      case ElementType.CDATA: {
        this.data = args.data || ''
        break
      }
      case ElementType.Directive: {
        if (!args.name) throw new Error("'name' is mandatory.")
        this.name = this._normalizeName(args.name)
        this.nameWithoutNS = nameWithoutNS(this.name)
        this.data = args.data
        break
      }
      case ElementType.Doctype: {
        this.data = args.data
        break
      }
      case 'document': {
        let format = args.format
        this.format = format
        if (!format) throw new Error("'format' is mandatory.")
        this.childNodes = args.children || args.childNodes || []
        switch (format) {
          case 'xml':
            this.contentType = 'application/xml'
            break
          case 'html':
            this.contentType = 'text/html'
            break
          default:
            throw new Error('Unsupported format ' + format)
        }
        break
      }
      default:
        this.name = null
        this.properties = new Map()
        this.attributes = new Map()
        this.classes = new Set()
        this.styles = new Map()
        this.eventListeners = []
        this.childNodes = args.children || args.childNodes || []
    }
  }

  getNativeElement () {
    return this
  }

  getNodeType () {
    switch (this.type) {
      case ElementType.Tag:
      case ElementType.Script:
      case ElementType.Style:
        return 'element'
      default:
        return this.type
    }
  }

  isTextNode () {
    return this.type === 'text'
  }

  isElementNode () {
    return this.type === 'tag' || this.type === 'script'
  }

  isCommentNode () {
    return this.type === 'comment'
  }

  isDocumentNode () {
    return this.type === 'document'
  }

  isComponentNode () {
    return this.type === 'component'
  }

  clone (deep) {
    let clone = new MemoryDOMElement(this.type, this)
    if (this.childNodes) {
      clone.childNodes.length = 0
      if (deep) {
        this.childNodes.forEach((child) => {
          clone.appendChild(child.clone(deep))
        })
      }
    }
    return clone
  }

  get tagName () {
    return this.getTagName()
  }

  set tagName (tagName) {
    this.setTagName(tagName)
  }

  getTagName () {
    return this.name
  }

  setTagName (tagName) {
    if (this._isXML()) {
      this.name = String(tagName)
    } else {
      this.name = String(tagName).toLowerCase()
    }
    this.nameWithoutNS = nameWithoutNS(this.name)
    return this
  }

  hasAttribute (name) {
    if (this.attributes) {
      return this.attributes.has(name)
    }
  }

  getAttribute (name) {
    if (this.attributes) {
      return this.attributes.get(name)
    }
  }

  setAttribute (name, value) {
    if (this.attributes) {
      value = String(value)
      // Note: keeping the Set version of classes and styles in sync
      switch (name) {
        case 'class':
          this.classes = new Set()
          parseClasses(this.classes, value)
          break
        case 'style':
          this.styles = new Map()
          parseStyles(this.styles, value)
          break
        default:
          //
      }
      this.attributes.set(name, value)
      if (this._isHTML()) {
        deriveHTMLPropertyFromAttribute(this, name, value)
      }
    }
    return this
  }

  removeAttribute (name) {
    if (this.attributes) {
      switch (name) {
        case 'class':
          this.classes = new Set()
          break
        case 'style':
          this.styles = new Map()
          break
        default:
          //
      }
      this.attributes.delete(name)
    }
    return this
  }

  getAttributes () {
    return this.attributes
  }

  getProperty (name) {
    if (this.properties) {
      return this.properties.get(name)
    }
  }

  setProperty (name, value) {
    if (this.properties) {
      if (this._isXML()) {
        throw new Error('setProperty() is only be used on HTML elements')
      }
      _setHTMLPropertyValue(this, name, value)
    }
    return this
  }

  hasClass (name) {
    if (this.classes) {
      return this.classes.has(name)
    }
  }

  addClass (name) {
    if (this.classes) {
      this.classes.add(name)
      this.attributes.set('class', stringifyClasses(this.classes))
    }
    return this
  }

  removeClass (name) {
    if (this.classes && this.classes.has(name)) {
      this.classes.delete(name)
      this.attributes.set('class', stringifyClasses(this.classes))
    }
    return this
  }

  getContentType () {
    return this.getOwnerDocument().contentType
  }

  getDoctype () {
    if (this.isDocumentNode()) {
      return _findDocTypeElement(this)
    } else {
      return this.getOwnerDocument().getDoctype()
    }
  }

  setDoctype (qualifiedNameStr, publicId, systemId) {
    // NOTE: there must be only one <!DOCTYPE> before the first content element
    let doc = this.getOwnerDocument()
    let oldDocType = _findDocTypeElement(doc)
    let newDocType = this.createDocumentType(qualifiedNameStr, publicId, systemId)
    if (oldDocType) {
      doc.replaceChild(newDocType, oldDocType)
    } else {
      // insert it before the first ELEMENT
      doc.insertBefore(newDocType, doc.getChildren()[0])
    }
    doc.doctype = newDocType
  }

  getInnerHTML () {
    let isXML = this._isXML()
    return DomUtils.getInnerHTML(this, { xmlMode: isXML, decodeEntities: !isXML })
  }

  // TODO: parse html using settings from el,
  // clear old childNodes and append new childNodes
  setInnerHTML (html) {
    if (this.childNodes) {
      let isXML = this._isXML()
      let _doc = parseMarkup(html, {
        ownerDocument: this.getOwnerDocument(),
        format: isXML ? 'xml' : 'html',
        decodeEntities: !isXML,
        elementFactory: MemoryDOMElementFactory
      })
      this.empty()
      // ATTENTION: important to copy the childNodes array first
      // as appendChild removes from parent
      _doc.childNodes.slice(0).forEach(child => {
        this.appendChild(child)
      })
    }
    return this
  }

  getOuterHTML () {
    let isXML = this._isXML()
    return DomUtils.getOuterHTML(this, { xmlMode: isXML, decodeEntities: !isXML })
  }

  getTextContent () {
    return DomUtils.getText(this)
  }

  setTextContent (text) {
    switch (this.type) {
      case ElementType.Text:
      case ElementType.Comment:
      case ElementType.CDATA: {
        this.data = text
        break
      }
      default: {
        if (this.childNodes) {
          let child = this.createTextNode(text)
          this.empty()
          this.appendChild(child)
        }
      }
    }
    return this
  }

  getStyle (name) {
    if (this.styles) {
      return this.styles.get(name)
    }
  }

  setStyle (name, value) {
    if (this.styles) {
      if (DOMElement.pxStyles[name] && isNumber(value)) {
        value = value + 'px'
      }
      this.styles.set(name, value)
      this.attributes.set('style', stringifyStyles(this.styles))
    }
    return this
  }

  is (cssSelector) {
    return cssSelect.is(this, cssSelector, { xmlMode: this._isXML() })
  }

  find (cssSelector) {
    return cssSelect.selectOne(cssSelector, this, { xmlMode: this._isXML() })
  }

  findAll (cssSelector) {
    return cssSelect.selectAll(cssSelector, this, { xmlMode: this._isXML() })
  }

  getChildCount () {
    if (this.childNodes) {
      return this.childNodes.length
    } else {
      return 0
    }
  }

  getChildNodes () {
    return this.childNodes.slice(0)
  }

  getChildren () {
    return this.childNodes.filter(function (node) {
      return node.type === 'tag'
    })
  }

  get children () {
    return this.getChildren()
  }

  getChildAt (pos) {
    if (this.childNodes) {
      return this.childNodes[pos]
    }
  }

  getChildIndex (child) {
    if (this.childNodes) {
      return this.childNodes.indexOf(child)
    }
  }

  getLastChild () {
    if (this.childNodes) {
      return last(this.childNodes)
    }
  }

  getFirstChild () {
    if (this.childNodes) {
      return this.childNodes[0]
    }
  }

  getNextSibling () {
    return this.next
  }

  getPreviousSibling () {
    return this.prev
  }

  getParent () {
    // TODO: to be consistent with the Browser implementation
    // root elements should return null as parent element.
    // However, this breaks other code ATM.
    // let parent = this.parent
    // if (parent && parent.type !== 'document') {
    //   return this.parent
    // } else {
    //   return null
    // }
    return this.parent
  }

  getOwnerDocument () {
    return (this.type === 'document') ? this : this.ownerDocument
  }

  getFormat () {
    return this.getOwnerDocument().format
  }

  createDocument (format) {
    return MemoryDOMElement.createDocument(format)
  }

  createElement (tagName) {
    return new MemoryDOMElement(ElementType.Tag, { name: tagName, ownerDocument: this.getOwnerDocument() })
  }

  createTextNode (text) {
    return new MemoryDOMElement(ElementType.Text, { data: text, ownerDocument: this.getOwnerDocument() })
  }

  createComment (data) {
    return new MemoryDOMElement(ElementType.Comment, { data: data, ownerDocument: this.getOwnerDocument() })
  }

  createProcessingInstruction (name, data) {
    return new MemoryDOMElement(ElementType.Directive, { name: name, data: data, ownerDocument: this.getOwnerDocument() })
  }

  createDocumentType (qualifiedNameStr, publicId, systemId) {
    return new MemoryDOMDoctype(ElementType.Doctype, { data: { name: qualifiedNameStr, publicId, systemId }, ownerDocument: this.getOwnerDocument() })
  }

  createCDATASection (data) {
    return new MemoryDOMElement(ElementType.CDATA, { data: data, ownerDocument: this.getOwnerDocument() })
  }

  appendChild (child) {
    if (this.childNodes && !isNil(child)) {
      child = this._normalizeChild(child)
      if (!child) return this
      DomUtils.appendChild(this, child)
      child.ownerDocument = this.getOwnerDocument()
    }
    return this
  }

  removeChild (child) {
    if (child.parentNode === this) {
      child.remove()
    }
  }

  insertAt (pos, child) {
    child = this._normalizeChild(child)
    if (!child) return this
    let childNodes = this.childNodes
    if (childNodes) {
      // NOTE: manipulating htmlparser's internal children array
      if (pos >= childNodes.length) {
        DomUtils.appendChild(this, child)
      } else {
        DomUtils.prepend(childNodes[pos], child)
      }
      child.ownerDocument = this.getOwnerDocument()
    }
    return this
  }

  insertBefore (newChild, before) {
    if (isNil(before)) {
      return this.appendChild(newChild)
    } else if (this.childNodes) {
      var pos = this.childNodes.indexOf(before)
      if (pos > -1) {
        DomUtils.prepend(before, newChild)
        newChild.ownerDocument = this.getOwnerDocument()
      } else {
        throw new Error('insertBefore(): reference node is not a child of this element.')
      }
    }
    return this
  }

  removeAt (pos) {
    let childNodes = this.childNodes
    if (childNodes) {
      let child = childNodes[pos]
      child.remove()
    }
    return this
  }

  empty () {
    let childNodes = this.childNodes
    if (childNodes) {
      childNodes.forEach((child) => {
        child.next = child.prev = child.parent = null
      })
      childNodes.length = 0
    }
    return this
  }

  remove () {
    DomUtils.removeElement(this)
    return this
  }

  replaceChild (oldChild, newChild) {
    if (oldChild.parent === this) {
      oldChild.replaceWith(newChild)
    }
    return this
  }

  replaceWith (newEl) {
    newEl = this._normalizeChild(newEl)
    DomUtils.replaceElement(this, newEl)
    newEl.ownerDocument = this.getOwnerDocument()
    return this
  }

  getEventListeners () {
    return this.eventListeners || []
  }

  click () {
    this.emit('click', { target: this, currentTarget: this })
    return true
  }

  emit (name, data) {
    this._propagateEvent(new MemoryDOMElementEvent(name, this, data))
  }

  getBoundingClientRect () {
    return { top: 0, left: 0, height: 0, width: 0 }
  }

  getClientRects () {
    return [{ top: 0, left: 0, height: 0, width: 0 }]
  }

  _propagateEvent (event) {
    let listeners = this.eventListeners
    if (listeners) {
      listeners.forEach(l => {
        if (l.eventName === event.type) {
          l.handler(event)
        }
      })
      if (event.stopped) return
      let p = this.parentNode
      if (p) p._propagateEvent(event)
    }
  }

  removeAllEventListeners () {
    this.eventListeners = []
    return this
  }

  _assign (other) {
    if (other.name) this.name = other.name
    if (this.classes && other.classes) {
      other.classes.forEach((val) => {
        this.classes.add(val)
      })
    }
    if (this.styles && other.styles) {
      forEach(other.styles, (val, name) => {
        this.styles.set(name, val)
      })
    }
    // TODO: while it is 'smart' to deal with 'style' and 'class'
    // implicitly, it introduces some confusion here
    let otherAttributes = other.attributes || other.attribs
    if (this.attributes && otherAttributes) {
      forEach(otherAttributes, (val, name) => {
        switch (name) {
          case 'class': {
            parseClasses(this.classes, val)
            break
          }
          case 'style': {
            parseStyles(this.styles, val)
            break
          }
          default:
            //
        }
        this.attributes.set(name, val)
      })
    }
    if (this.eventListeners && other.eventListeners) {
      this.eventListeners = this.eventListeners.concat(other.eventListeners)
    }
  }

  _normalizeChild (child) {
    if (isNil(child)) return

    if (isString(child)) {
      child = this.createTextNode(child)
    }
    /* istanbul ignore next */
    if (!child || !child._isMemoryDOMElement) {
      throw new Error('Illegal argument: only String and MemoryDOMElement instances are valid.')
    }
    return child
  }

  _normalizeName (name) {
    if (this._isXML()) {
      return name
    } else {
      return name.toLowerCase()
    }
  }

  _isHTML () {
    return this.getFormat() === 'html'
  }

  _isXML () {
    return this.getFormat() === 'xml'
  }

  // TODO: do we really need this?
  get _isMemoryDOMElement () { return true }

  static createDocument (format, opts = {}) {
    if (format === 'xml') {
      let doc = new MemoryDOMElement('document', { format: format })
      let xmlInstruction = []
      if (opts.version) {
        xmlInstruction.push(`version="${opts.version}"`)
      }
      if (opts.encoding) {
        xmlInstruction.push(`encoding="${opts.encoding}"`)
      }
      if (xmlInstruction.length > 0) {
        doc._xmlInstruction = doc.createProcessingInstruction('xml', xmlInstruction.join(' '))
      }
      return doc
    } else {
      return MemoryDOMElement.parseMarkup(DOMElement.EMPTY_HTML, 'html')
    }
  }

  static parseMarkup (str, format, options = {}) {
    if (!str) {
      return MemoryDOMElement.createDocument(format)
    }
    // decodeEntities by default only in HTML mode
    let decodeEntities = format === 'html'
    let parserOpts = Object.assign({
      format,
      decodeEntities,
      elementFactory: MemoryDOMElementFactory
    }, options)
    // opt-out from HTML structure sanitization
    if (options.raw) {
      return parseMarkup(str, parserOpts)
    }
    if (options.snippet) {
      str = `<__snippet__>${str}</__snippet__>`
    }
    let doc
    if (format === 'html') {
      doc = parseMarkup(str, parserOpts)
      _sanitizeHTMLStructure(doc)
    } else if (format === 'xml') {
      doc = parseMarkup(str, parserOpts)
    }
    if (options.snippet) {
      let childNodes = doc.find('__snippet__').childNodes
      if (childNodes.length === 1) {
        return childNodes[0]
      } else {
        return childNodes
      }
    } else {
      return doc
    }
  }

  static wrapNativeElement (el) {
    if (inBrowser) {
      // HACK: at many places we have an `isBrowser` check
      // to skip code that uses window or window.document
      // To be able to test such code together with the memory DOM implementation
      // we stub out window and document
      if (el === window || el === window.document) {
        return new DOMElementStub()
      // HACK: additionally, if a window.document.Node or a BrowserDOMElement is given
      // as it happens when trying to mount onto t.sandbox with DefaultDOMElement using MemoryDOMElement as default
      // we just return a new root element
      } else if (el instanceof window.Node || el._isBrowserDOMElement) {
        // return MemoryDOMElement.createDocument('html').createElement('div')
      }
    }
    /* istanbul ignore next */
    if (!el._isMemoryDOMElement) {
      throw new Error('Illegal argument: expected MemoryDOMElement instance')
    }
    return el
  }

  static wrap (el) { return MemoryDOMElement.wrapNativeElement(el) }

  static unwrap (el) {
    /* istanbul ignore next */
    if (!el._isMemoryDOMElement) {
      throw new Error('Illegal argument: expected MemoryDOMElement instance')
    }
    return el
  }

  // TODO: this is used only in browser to determine if
  // a selection  is reverse.
  /* istanbul ignore next */
  static isReverse () {
    return false
  }

  static getBrowserWindow () {
    // HACK: this is a bit awkward
    if (!_browserWindowStub) {
      _browserWindowStub = new MemoryWindowStub()
    }
    return _browserWindowStub
  }
}

function MemoryDOMElementFactory (type, data) {
  return new MemoryDOMElement(type, data)
}

class MemoryDOMDoctype extends MemoryDOMElement {
  get name () { return this.data.name }
  get publicId () { return this.data.publicId }
  get systemId () { return this.data.systemId }
}

function parseClasses (classes, classStr) {
  classStr.split(/\s+/).forEach((name) => {
    classes.add(name)
  })
}

function stringifyClasses (classes) {
  return Array.from(classes).join(' ')
}

function parseStyles (styles, styleStr) {
  styleStr = (styleStr || '').trim()
  if (!styleStr) return
  styleStr.split(';').forEach((style) => {
    let n = style.indexOf(':')
    // skip if there is no :, or if it is the first/last character
    if (n < 1 || n === style.length - 1) return
    let name = style.slice(0, n).trim()
    let val = style.slice(n + 1).trim()
    styles.set(name, val)
  })
}

function stringifyStyles (styles) {
  if (!styles) return ''
  let str = Object.keys(styles).map((name) => {
    return name + ':' + styles[name]
  }).join(';')
  if (str.length > 0) str += ';'
  return str
}

const BUILTIN_EVENTS = [
  'keydown', 'keyup', 'keypress',
  'mousedown', 'mouseup', 'mouseover', 'click', 'dblclick'
].reduce((m, k) => { m[k] = true; return m }, {})

class MemoryDOMElementEvent {
  constructor (type, target, detail) {
    this.type = type
    this.timeStamp = Date.now()
    this.target = target

    if (BUILTIN_EVENTS[type]) {
      // TODO: dunno if this is the best way of doing it
      if (detail) {
        Object.assign(this, detail)
      }
    } else {
      this.detail = detail
    }
  }

  stopPropagation () {
    this.stopped = true
  }

  preventDefault () {
    this.defaultPrevented = true
  }
}

class DOMElementStub {
  on () {}
  off () {}
}

// EXPERIMENTAL: we want to be able to use the Router in
// tests using MemoryDOM
class MemoryWindowStub extends MemoryDOMElement {
  constructor () {
    super('window', { ownerDocument: MemoryDOMElement.createDocument('html') })

    let location = {
      href: '',
      hash: ''
    }

    function _updateLocation (url) {
      let hashIdx = url.indexOf('#')
      location.href = url
      if (hashIdx >= 0) {
        location.hash = url.slice(hashIdx)
      }
    }

    let history = {
      replaceState (stateObj, title, url) {
        _updateLocation(url)
      },
      pushState (stateObj, title, url) {
        _updateLocation(url)
      }
    }

    this.location = location
    this.history = history
  }
}

function nameWithoutNS (name) {
  const idx = name.indexOf(':')
  if (idx > 0) {
    return name.slice(idx + 1)
  } else {
    return name
  }
}

// Note: some attributes are used to initialize an
// element property
const ATTR_TO_PROPS = {
  'input': {
    'value': true,
    'checked': (el, name, value) => {
      const checked = (value !== 'off')
      el.setProperty('checked', checked)
    }
  }
}

function deriveHTMLPropertyFromAttribute (el, name, value) {
  const mappings = ATTR_TO_PROPS[el.tagName]
  if (mappings) {
    let mapper = mappings[name]
    if (mapper === true) {
      el.setProperty(name, value)
    } else if (mapper) {
      mapper(el, name, value)
    }
  }
}

const PROPERTY_TRANSFORMATIONS = {
  'input': {
    'checked': (el, name, value) => {
      if (value === true) {
        el.properties.set(name, true)
        el.properties.set('value', 'on')
      } else {
        el.properties.set(name, false)
        el.properties.set('value', 'off')
      }
    },
    'value': (el, name, value) => {
      let type = el.getAttribute('type')
      switch (type) {
        case 'checkbox':
          if (value === 'on') {
            el.properties.set(name, true)
            el.properties.set('value', 'on')
          } else {
            el.properties.set(name, false)
            el.properties.set('value', 'off')
          }
          break
        default:
          _setProperty(el, name, value)
      }
    }
  }
}

function _setProperty (el, name, value) {
  if (value === undefined) {
    el.properties.delete(name)
  } else {
    el.properties.set(name, String(value))
  }
}

function _setHTMLPropertyValue (el, name, value) {
  const trafos = PROPERTY_TRANSFORMATIONS[el.tagName]
  if (trafos) {
    let mapper = trafos[name]
    if (mapper) {
      mapper(el, name, value)
      return
    }
  }
  _setProperty(el, name, value)
}

function _sanitizeHTMLStructure (doc) {
  // as opposed to DOMParser in the browser
  // htmlparser2 does not create <head> and <body> per se
  // thus we need to make sure that everything is working
  // similar as in the browser
  let htmlEl = doc.find('html')
  if (!htmlEl) {
    // remove head and nodes which must go into the head
    // so they do not go into the body
    let headEl = doc.find('head')
    let titleEl = doc.find('title')
    let metaEls = doc.findAll('meta')
    let bodyEl = doc.find('body')
    if (headEl) headEl.remove()
    if (titleEl) titleEl.remove()
    metaEls.forEach(e => e.remove())
    if (bodyEl) bodyEl.remove()

    // keep the remaining content nodes,
    // we will add them to the body
    let contentNodes = doc.childNodes.slice()
    contentNodes.forEach((c) => { c.parent = null })
    doc.childNodes.length = 0

    htmlEl = doc.createElement('html')
    // if not there create a <head> and
    // add all the elements that are supposed to
    // go there
    if (!headEl) {
      headEl = doc.createElement('head')
      headEl.appendChild(titleEl)
      headEl.append(metaEls)
      htmlEl.appendChild(headEl)
    }
    if (!bodyEl) {
      bodyEl = doc.createElement('body')
      bodyEl.append(contentNodes)
    }
    htmlEl.appendChild(bodyEl)

    doc.append(htmlEl)
  }
}

function _findDocTypeElement (doc) {
  // Note: the looked up doctype element will be cached on the document element
  if (doc.doctype) return doc.doctype
  const childNodes = doc.childNodes
  for (let i = 0; i < childNodes.length; i++) {
    let child = childNodes[i]
    if (child.type === ElementType.Doctype) {
      doc.doctype = child
      return child
    }
  }
}
