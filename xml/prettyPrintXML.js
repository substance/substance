import { DefaultDOMElement as DOM } from '../dom'
import { isString } from '../util'
import _isTextNodeEmpty from './_isTextNodeEmpty'

/*
  Schema drive pretty-printer, that inserts indentation for
  structural elements, and preserves white-spaces for text nodes and inline-elements
*/
export default function prettyPrintXML(xml) {
  let dom
  if (isString(xml)) {
    dom = DOM.parseXML(xml)
  } else {
    dom = xml
  }
  const result = []
  dom.children.forEach((el) => {
    _prettyPrint(result, el, 0)
  })
  return result.join('\n')
}

function _prettyPrint(result, el, level) {
  let indent = new Array(level*2).fill(' ').join('')
  if (el.isElementNode()) {
    const isMixed = _isMixed(el)
    if (isMixed) {
      result.push(indent + el.outerHTML)
    } else {
      let children = el.children
      const tagName = el.tagName
      let tagStr = [`<${tagName}`]
      el.getAttributes().forEach((val, name) => {
        tagStr.push(`${name}="${val}"`)
      })
      if (children.length > 0) {
        result.push(indent + tagStr.join(' ') + '>')
        el.children.forEach((child) => {
          _prettyPrint(result, child, level+1)
        })
        result.push(indent + `</${tagName}>`)
      } else {
        result.push(indent + tagStr.join(' ') + ' />')
      }
    }
  } else {
    result.push(indent + el.outerHTML)
  }
}

function _isMixed(el) {
  const childNodes = el.childNodes
  for (let i = 0; i < childNodes.length; i++) {
    let child = childNodes[i]
    if (child.isTextNode() && !_isTextNodeEmpty(child)) {
      return true
    }
  }
}
