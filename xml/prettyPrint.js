import { DefaultDOMElement as DOM } from '../dom'

/*
  Schema drive pretty-printer, that inserts indentation for
  structural elements, and preserves white-spaces for text nodes and inline-elements
*/
export default function prettyPrint(classification, xml) {
  const dom = DOM.parseXML(xml)
  const result = []
  dom.children.forEach((el) => {
    _prettyPrint(result, classification, el, 0)
  })
  return result.join('\n')
}

function _prettyPrint(result, classification, el, level) {
  let indent = new Array(level*2).join(' ')
  if (el.isElementNode()) {
    let tagName = el.tagName
    if (classification[tagName] === 'element') {
      let tagStr = [`<${tagName}`]
      el.getAttributes().forEach((val, name) => {
        tagStr.push(`${name}="${val}"`)
      })
      result.push(indent + tagStr.join(' ') + '>')
      el.children.forEach((child) => {
        _prettyPrint(result, classification, child, level+1)
      })
      result.push(indent + `</${tagName}>`)
    } else {
      result.push(indent + el.outerHTML)
    }
  } else {
    result.push(indent + el.outerHTML)
  }
}