import inBrowser from '../util/inBrowser'
import BrowserDOMElement from './BrowserDOMElement'
import XNode from './XNode'

const DefaultDOMElementClass = inBrowser ? BrowserDOMElement : XNode

/**
  A Bridge to the default DOMElement implementation, either BrowserDOMElement, or MemoryDOMElement.
*/
let DefaultDOMElement = {}

DefaultDOMElement.createDocument = function(format) {
  return DefaultDOMElement._impl.createDocument(format)
}

DefaultDOMElement.createElement = function(tagName) {
  return DefaultDOMElement._impl.createElement(tagName)
}

DefaultDOMElement.createTextNode = function(text) {
  return DefaultDOMElement._impl.createTextNode(text)
}

/*
  A wrapper for Browser's `window` providing
  the DOMElement's eventlistener API.
*/
DefaultDOMElement.getBrowserWindow = function() {
  return DefaultDOMElement._impl.getBrowserWindow()
}

/*
  @param {String} html
  @returns {DOMElement|DOMElement[]}
*/
DefaultDOMElement.parseHTML = function(html) {
  return DefaultDOMElement._impl.parseHTML(html)
}

/*
  @param {String} xml
  @returns {DOMElement|DOMElement[]}
*/
DefaultDOMElement.parseXML = function(xml, fullDoc) {
  return DefaultDOMElement._impl.parseXML(xml, fullDoc)
}

DefaultDOMElement.wrap =
DefaultDOMElement.wrapNativeElement = function(el) {
  if (!el) throw new Error('Illegal argument')
  // in Browser we can use both implementations
  if (el._isXNode) return el
  else return DefaultDOMElement._impl.wrapNativeElement(el)
}

DefaultDOMElement.isReverse = function(anchorNode, anchorOffset, focusNode, focusOffset) {
  return DefaultDOMElement._impl.isReverse(anchorNode, anchorOffset, focusNode, focusOffset)
}

DefaultDOMElement._impl = DefaultDOMElementClass

DefaultDOMElement._reset = function() {
  DefaultDOMElement._impl = DefaultDOMElementClass
}

DefaultDOMElement._useXNode = function() {
  DefaultDOMElement._impl = XNode
}

export default DefaultDOMElement
