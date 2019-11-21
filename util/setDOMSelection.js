export default function setDOMSelection (startNode, startOffset, endNode, endOffset) {
  const wsel = window.getSelection()
  const wrange = window.document.createRange()
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
