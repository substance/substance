import DOM from '../dom/DefaultDOMElement'
import Fragmenter from '../model/Fragmenter'

export function appendChild (xmlNode, child) {
  insertAt(xmlNode, xmlNode._childNodes.length, child)
  return xmlNode
}

export function getChildPos (xmlNode, child) {
  return xmlNode._childNodes.indexOf(child.id)
}

export function removeChild (xmlNode, child) {
  const childPos = getChildPos(xmlNode, child)
  if (childPos >= 0) {
    removeAt(xmlNode, childPos)
  } else {
    throw new Error(`Node ${child.id} is not a child of ${xmlNode.id}`)
  }
  return xmlNode
}

export function insertBefore (xmlNode, newChild, ref) {
  if (!ref) {
    appendChild(xmlNode, newChild)
  } else {
    let pos = getChildPos(xmlNode, ref)
    if (pos < 0) {
      throw new Error(`Node ${newChild.id} is not a child of ${xmlNode.id}`)
    }
    insertAt(xmlNode, pos, newChild)
  }
  return xmlNode
}

export function insertAt (xmlNode, pos, child) {
  const length = xmlNode._childNodes.length
  if (pos >= 0 && pos <= length) {
    const doc = xmlNode.getDocument()
    doc.update([xmlNode.id, '_childNodes'], { type: 'insert', pos, value: child.id })
  } else {
    throw new Error('Index out of bounds.')
  }
  return xmlNode
}

export function removeAt (xmlNode, pos) {
  const length = xmlNode._childNodes.length
  if (pos >= 0 && pos < length) {
    const doc = xmlNode.getDocument()
    doc.update([xmlNode.id, '_childNodes'], { type: 'delete', pos: pos })
  } else {
    throw new Error('Index out of bounds.')
  }
  return xmlNode
}

export function getInnerXML (xmlNode) {
  if (xmlNode._childNodes) {
    return xmlNode.getChildNodes().map(child => {
      return child.toXML().serialize()
    }).join('')
  } else if (xmlNode.isText()) {
    return xmlNode.toXML().getInnerXML()
  }
  return ''
}

export function getChildAt (xmlNode, idx) {
  let childId = xmlNode._childNodes[idx]
  if (childId) {
    return xmlNode.getDocument().get(childId)
  }
}

// converts a node into an XML DOM node
export function node2element (node) {
  // It is important to specify 'xml' as the document type
  let dom = DOM.createDocument('xml')
  let el = _node2element(dom, node)
  return el
}

function _node2element (dom, node) {
  let el
  switch (node._elementType) {
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

function _createElement (dom, node) {
  let el = dom.createElement(node.type)
  el.attr('id', node.id)
  el.attr(node.attributes)
  return el
}

function _renderElementNode (dom, node) {
  let el = _createElement(dom, node)
  el.append(node.getChildren().map(child => _node2element(dom, child)))
  return el
}

function _renderTextNode (dom, node) {
  const annos = node.getAnnotations()
  const text = node.getText()
  let el = _createElement(dom, node)
  if (annos && annos.length > 0) {
    let fragmenter = new Fragmenter({
      onText: (context, text) => {
        const node = context.node
        if (node.isText() || (node.isAnnotation() && !node._isInlineNode)) {
          context.el.append(text)
        }
      },
      onEnter: (fragment) => {
        return {
          el: _node2element(dom, fragment.node),
          node: fragment.node
        }
      },
      onExit: (fragment, context, parentContext) => {
        parentContext.el.append(context.el)
      }
    })
    fragmenter.start({ el, node }, text, annos)
  } else {
    el.append(text)
  }
  return el
}
