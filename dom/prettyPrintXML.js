import DOM from './DefaultDOMElement'
import _isTextNodeEmpty from './_isTextNodeEmpty'
import isString from '../util/isString'

export default function prettyPrintXML (xml) {
  let dom
  if (isString(xml)) {
    dom = DOM.parseXML(xml)
  } else {
    dom = xml
  }
  const result = []
  // Note: the browser treats XML instructions in a surprising way:
  // parsing `<?xml version="1.0" encoding="UTF-8"?><dummy/>` results in only one element
  // i.e. the instruction is swallowed and stored in a way that it is created during serialization.
  // Interestingly, this is not the case for the DOCTYPE declaration.
  // ATTENTION: we have assimilated the MemoryDOM implementation, so that we get the same result.
  if (dom.isDocumentNode()) {
    const childNodes = dom.getChildNodes()
    const xml = dom.empty().serialize()
    if (/<\?\s*xml/.exec(xml)) {
      result.push(xml)
    }
    childNodes.forEach(el => {
      _prettyPrint(result, el, 0)
    })
  } else {
    _prettyPrint(result, dom, 0)
  }
  return result.join('\n')
}

function _prettyPrint (result, el, level) {
  const indent = new Array(level * 2).fill(' ').join('')
  if (el.isElementNode()) {
    const isMixed = _isMixed(el)
    const containsCDATA = _containsCDATA(el)
    if (isMixed || containsCDATA) {
      result.push(indent + el.outerHTML)
    } else {
      const children = el.children
      const tagName = el.tagName
      const tagStr = [`<${tagName}`]
      el.getAttributes().forEach((val, name) => {
        tagStr.push(`${name}="${val}"`)
      })
      if (children.length > 0) {
        result.push(indent + tagStr.join(' ') + '>')
        el.children.forEach((child) => {
          _prettyPrint(result, child, level + 1)
        })
        result.push(indent + `</${tagName}>`)
      } else {
        result.push(indent + tagStr.join(' ') + ' />')
      }
    }
  } else if (level === 0 && el.isTextNode()) {
    // skip text outside of the root element
  } else {
    result.push(indent + el.outerHTML)
  }
}

function _isMixed (el) {
  const childNodes = el.childNodes
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i]
    if (child.isTextNode() && !_isTextNodeEmpty(child)) {
      return true
    }
  }
}

function _containsCDATA (el) {
  const childNodes = el.childNodes
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i]
    if (child.getNodeType() === 'cdata') {
      return true
    }
  }
}
