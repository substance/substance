import inBrowser from '../util/inBrowser'
import BrowserDOMElement from './BrowserDOMElement'
import XNode from './XNode'

const DefaultDOMElementClass = inBrowser ? BrowserDOMElement : XNode

/**
  A Bridge to the default DOMElement implementation, either BrowserDOMElement, or MemoryDOMElement.
*/
let DefaultDOMElement = {}

DefaultDOMElement.createDocument = function(format) {
  return DefaultDOMElementClass.createDocument(format)
}

DefaultDOMElement.createElement = function(tagName) {
  return DefaultDOMElementClass.createElement(tagName)
}

DefaultDOMElement.createTextNode = function(text) {
  return DefaultDOMElementClass.createTextNode(text)
}

/*
  A wrapper for Browser's `window` providing
  the DOMElement's eventlistener API.
*/
DefaultDOMElement.getBrowserWindow = function() {
  return DefaultDOMElementClass.getBrowserWindow()
}

/*
  @param {String} html
  @returns {DOMElement|DOMElement[]}
*/
DefaultDOMElement.parseHTML = function(html) {
  return DefaultDOMElementClass.parseHTML(html)
}

/*
  @param {String} xml
  @returns {DOMElement|DOMElement[]}
*/
DefaultDOMElement.parseXML = function(xml, fullDoc) {
  return DefaultDOMElementClass.parseXML(xml, fullDoc)
}

DefaultDOMElement.wrap =
DefaultDOMElement.wrapNativeElement = function(el) {
  if (!el) throw new Error('Illegal argument')
  // in Browser we can use both implementations
  if (el._isXNode) return el
  else return DefaultDOMElementClass.wrapNativeElement(el)
}

DefaultDOMElement.isReverse = function(anchorNode, anchorOffset, focusNode, focusOffset) {
  return DefaultDOMElementClass.isReverse(anchorNode, anchorOffset, focusNode, focusOffset)
}

export default DefaultDOMElement
