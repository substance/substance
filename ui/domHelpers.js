import Component from './Component'

/*
  Looks for the first parent Component instance for a give´n native element.
*/
export function findParentComponent(el) {
  while (el) {
    const comp = Component.unwrap(el)
    if (comp) return comp
    el = el.parentNode
  }
}

export function setDOMSelection(startNode, startOffset, endNode, endOffset) {
  let wsel = window.getSelection()
  let wrange = window.document.createRange()
  if (startNode._isDOMElement) {
    startNode = startNode.getNativeElement()
  }
  if (!endNode) {
    endNode = startNode
    endOffset = startOffset
  }
  if (endNode._isDOMElement) {
    endNode = endNode.getNativeElement()
  }
  wrange.setStart(startNode, startOffset)
  wrange.setEnd(endNode, endOffset)
  wsel.removeAllRanges()
  wsel.addRange(wrange)
}
