import inBrowser from '../util/inBrowser'
import BrowserDOMElement from '../ui/BrowserDOMElement.js'
import MemoryDOMElement from '../ui/MemoryDOMElement.js'

const DefaultDOMElementClass = inBrowser ? BrowserDOMElement : MemoryDOMElement

/**
  A Bridge to the default DOMElement implementation, either BrowserDOMElement, or MemoryDOMElement.
*/
let DefaultDOMElement = {}

DefaultDOMElement.createTextNode = function(text) {
  return DefaultDOMElementClass.createTextNode(text)
}

DefaultDOMElement.createElement = function(tagName) {
  return DefaultDOMElementClass.createElement(tagName)
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
  return DefaultDOMElementClass.parseXML(xml, { fullDoc: fullDoc })
}

DefaultDOMElement.wrapNativeElement = function(el) {
  return DefaultDOMElementClass.wrapNativeElement(el)
}

DefaultDOMElement.isReverse = function(anchorNode, anchorOffset, focusNode, focusOffset) {
  return DefaultDOMElementClass.isReverse(anchorNode, anchorOffset, focusNode, focusOffset)
}

export default DefaultDOMElement
