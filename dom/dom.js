import parseMarkup from './parseMarkup'
import XNode from './XNode'

export function parseHTML(html) {
  return parseMarkup(html, { format: 'html' })
}

export function parseXML(xml) {
  return parseMarkup(xml, { format: 'xml' })
}

export function createTextNode(text, options) {
  return XNode.createTextNode(text, options)
}

export function createElement(tagName, options) {
  return XNode.createElement(tagName, options)
}