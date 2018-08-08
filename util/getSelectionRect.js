import platform from './platform'
import getRelativeRect from './getRelativeRect'

/*
  Get selection rectangle relative to panel content element
*/
export default function getSelectionRect (parentRect) {
  if (platform.inBrowser) {
    const wsel = window.getSelection()
    if (wsel.rangeCount === 0) return
    const wrange = wsel.getRangeAt(0)
    let contentRect = parentRect
    let selectionRect = wrange.getBoundingClientRect()

    if (selectionRect.top === 0 && selectionRect.bottom === 0) {
      selectionRect = _fixCorruptDOMSelection(wsel, wrange)
    }
    return getRelativeRect(contentRect, selectionRect)
  }
}

/*
  If this gets called too without having rendered the DOM selection properly
  it often does not have a valid bounding rectangle.
  If you see this called you probably should fix your application implementation.
  Very likely you did not call Surface.rerenderDOMSelection() before trying to
  use the DOM selection, e.g. for positioning an overlay.
*/
function _fixCorruptDOMSelection (wsel, wrange) {
  console.error('FIXME: DOM selection is corrupt. This can happen if you try to retrieve the selection rectangle too early, i.e., without having rendered the DOM selection before.')
  let anchorNode = wsel.anchorNode
  if (!anchorNode) return
  let rect = anchorNode.getBoundingClientRect()
  return {
    left: rect.left,
    top: rect.top,
    width: 0,
    height: rect.height,
    right: rect.width,
    bottom: rect.bottom
  }
}
