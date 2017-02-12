import isNil from './isNil'
import inBrowser from './inBrowser'

export function getDOMRangeFromEvent(evt) {
  let range, x = evt.clientX, y = evt.clientY
  // Try the simple IE way first
  if (document.body.createTextRange) {
    range = document.body.createTextRange()
    range.moveToPoint(x, y)
  }
  else if (!isNil(document.createRange)) {
    // Try Mozilla's rangeOffset and rangeParent properties,
    // which are exactly what we want
    if (!isNil(evt.rangeParent)) {
      range = document.createRange()
      range.setStart(evt.rangeParent, evt.rangeOffset)
      range.collapse(true)
    }
    // Try the standards-based way next
    else if (document.caretPositionFromPoint) {
      let pos = document.caretPositionFromPoint(x, y)
      range = document.createRange()
      range.setStart(pos.offsetNode, pos.offset)
      range.collapse(true)
    }
    // Next, the WebKit way
    else if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y)
    }
  }
  return range
}

/*
  Get selection rectangle relative to panel content element
*/
export function getSelectionRect(parentRect) {
  if (inBrowser) {
    const wsel = window.getSelection()
    if (wsel.rangeCount === 0) return
    const wrange = wsel.getRangeAt(0)
    let contentRect = parentRect
    let selectionRect = wrange.getBoundingClientRect()
    if (selectionRect.top === 0 && selectionRect.bottom === 0) {
      selectionRect = _fixForCursorRectBug()
    }
    return getRelativeRect(contentRect, selectionRect)
  }
}

function _fixForCursorRectBug() {
  let wsel = window.getSelection()
  let rects = wsel.anchorNode.parentElement.getClientRects()
  return rects[0]
}

export function getRelativeRect(parentRect, childRect) {
  var left = childRect.left - parentRect.left
  var top = childRect.top - parentRect.top
  return {
    left: left,
    top: top,
    right: parentRect.width - left - childRect.width,
    bottom: parentRect.height - top - childRect.height,
    width: childRect.width,
    height: childRect.height
  }
}

export function isMouseInsideDOMSelection(e) {
  let wsel = window.getSelection()
  if (wsel.rangeCount === 0) {
    return false
  }
  let wrange = wsel.getRangeAt(0)
  let selectionRect = wrange.getBoundingClientRect()
  return e.clientX >= selectionRect.left &&
         e.clientX <= selectionRect.right &&
         e.clientY >= selectionRect.top &&
         e.clientY <= selectionRect.bottom
}