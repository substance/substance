import isNil from './isNil'
import platform from './platform'

export function getDOMRangeFromEvent (evt) {
  let range
  let x = evt.clientX
  let y = evt.clientY
  // Try the simple IE way first
  if (document.body.createTextRange) {
    range = document.body.createTextRange()
    range.moveToPoint(x, y)
  } else if (!isNil(document.createRange)) {
    // Try Mozilla's rangeOffset and rangeParent properties,
    // which are exactly what we want
    if (!isNil(evt.rangeParent)) {
      range = document.createRange()
      range.setStart(evt.rangeParent, evt.rangeOffset)
      range.collapse(true)
    // Try the standards-based way next
    } else if (document.caretPositionFromPoint) {
      let pos = document.caretPositionFromPoint(x, y)
      range = document.createRange()
      range.setStart(pos.offsetNode, pos.offset)
      range.collapse(true)
    // Try the standards-based way next
    } else if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y)
    }
  }
  return range
}

/*
  Get selection rectangle relative to panel content element
*/
export function getSelectionRect (parentRect) {
  if (platform.inBrowser) {
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

function _fixForCursorRectBug () {
  let wsel = window.getSelection()
  let el = wsel.anchorNode
  if (!el) return
  while (el && el.nodeType !== 1) {
    el = el.parentNode
  }
  let rects = el.getClientRects()
  let rect = rects[0]
  return {
    left: rect.left,
    top: rect.top,
    width: 0,
    height: rect.height,
    right: rect.width,
    bottom: rect.bottom
  }
}

export function getRelativeRect (parentRect, childRect) {
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

export function isMouseInsideDOMSelection (e) {
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

export function setDOMSelection (startNode, startOffset, endNode, endOffset) {
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

/**
  Get the value of a querystring parameter
  @param  {String} param The field to get the value of
  @param  {String} url   The URL to get the value from (optional)
  @return {String}       The param value
 */
export function getQueryStringParam (param, url) {
  if (typeof window === 'undefined') return null
  let href = url || window.location.href
  let reg = new RegExp('[?&]' + param + '=([^&#]*)', 'i')
  let string = reg.exec(href)
  return string ? decodeURIComponent(string[1]) : null
}
