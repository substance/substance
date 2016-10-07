/*
  DOM selection helper
*/
export default function setDOMSelection(startNode, startOffset, endNode, endOffset) {
  var sel = window.getSelection()
  var range = window.document.createRange()
  if (startNode._isDOMElement) {
    startNode = startNode.getNativeElement()
  }
  if (endNode._isDOMElement) {
    endNode = endNode.getNativeElement()
  }
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  sel.removeAllRanges()
  sel.addRange(range)
}
