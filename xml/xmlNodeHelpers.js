export default {
  appendChild,
  removeChild,
  insertBefore,
  insertAt,
  removeAt,
  getInnerXML,
  getChildAt
}

function appendChild(xmlNode, child) {
  insertAt(xmlNode, xmlNode._childNodes.length, child)
}

function removeChild(xmlNode, child) {
  const childId = child.id
  const childPos = xmlNode._childNodes.indexOf(childId)
  if (childPos >= 0) {
    removeAt(xmlNode, childPos)
  } else {
    throw new Error(`node ${childId} is not a child of ${xmlNode.id}`)
  }
  return xmlNode
}

function insertBefore(xmlNode, newChild, ref) {
  if (!ref) {
    appendChild(newChild)
  } else {
    let pos = xmlNode._childNodes.indexOf(ref.id)
    if (pos < 0) {
      throw new Error('Given node is not a child.')
    }
    insertAt(xmlNode, pos, newChild)
  }
}

function insertAt(xmlNode, pos, child) {
  const length = xmlNode._childNodes.length
  if (pos >= 0 && pos <= length) {
    const doc = xmlNode.getDocument()
    doc.update([xmlNode.id, '_childNodes'], { type: 'insert', pos, value: child.id })
  } else {
    throw new Error('Index out of bounds.')
  }
  return xmlNode
}

function removeAt(xmlNode, pos) {
  const length = xmlNode._childNodes.length
  if (pos >= 0 && pos < length) {
    const doc = xmlNode.getDocument()
    doc.update([xmlNode.id, '_childNodes'], { type: 'delete', pos: pos })
  } else {
    throw new Error('Index out of bounds.')
  }
  return xmlNode
}

function getInnerXML(xmlNode) {
  return xmlNode.getChildren().map(child => {
    return child.toXML().outerHTML
  }).join('')
}

function getChildAt(xmlNode, idx) {
  let childId = xmlNode._childNodes[idx]
  if (childId) {
    return xmlNode.getDocument().get(childId)
  }
}
