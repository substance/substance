import { DefaultDOMElement as DOM } from '../dom'
import { Fragmenter } from '../model'

// converts a node into a DOM node
export default function node2element(node) {
  let dom = DOM.createDocument()
  return _node2element(dom, node)
}

function _node2element(dom, node) {
  let el
  switch(node._elementType) {
    case 'text': {
      el = _renderTextNode(dom, node)
      break
    }
    case 'element':
    case 'inline-element':
    case 'container': {
      el = _renderElementNode(dom, node)
      break
    }
    case 'anchor':
    case 'annotation': {
      el = _createElement(dom, node)
      break
    }
    case 'external': {
      el = DOM.parseSnippet(node.xml, 'xml')
      break
    }
    default:
      throw new Error('Invalid element type.')
  }
  return el
}

function _createElement(dom, node) {
  let el = dom.createElement(node.type)
  el.attr(node.attributes)
  return el
}

function _renderElementNode(dom, node) {
  let el = _createElement(dom, node)
  el.attr(node.attributes)
  return el
}

function _renderTextNode(dom, node) {
  const annos = node.getAnnotations()
  const text = node.getText()
  let el = _createElement(dom, node)
  if (annos && annos.length > 0) {
    let fragmenter = new Fragmenter({
      onText: (context, text) => { context.append(text) },
      onEnter: (fragment) => {
        return _node2element(dom, fragment.node)
      },
      onExit: (fragment, context, parentContext) => {
        parentContext.append(context)
      }
    });
    fragmenter.start(el, text, annos)
  } else {
    el.append(text)
  }
  return el
}