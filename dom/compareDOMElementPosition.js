export const BEFORE = -1
export const AFTER = 1
export const PARENT = -2
export const CHILD = 2

export default function compareDOMElementPosition (a, b) {
  if (a.el._isBrowserDOMElement) {
    let res = a.getNativeElement().compareDocumentPosition(b.getNativeElement())
    if (res & window.Node.DOCUMENT_POSITION_CONTAINS) {
      return CHILD
    } else if (res & window.Node.DOCUMENT_POSITION_CONTAINED_BY) {
      return PARENT
    } else if (res & window.Node.DOCUMENT_POSITION_PRECEDING) {
      return AFTER
    } else if (res & window.Node.DOCUMENT_POSITION_FOLLOWING) {
      return BEFORE
    } else {
      return 0
    }
  } else {
    console.error('FIXME: compareDOMElementPosition() is not implemented for MemoryDOMElement.')
    return 0
  }
}
