import forEach from './forEach'
import isArray from './isArray'

/**
  Get bounding rectangle relative to a given parent element. Allows multiple
  elements being passed (we need this for selections that consist of multiple
  selection fragments). Takes a relative parent element that is used as a
  reference point, instead of the browser's viewport.

  @param {DOMElement[]} els elements to compute the bounding rectangle for
  @param {DOMElement} containerEl relative parent used as a reference point
  @return {object} rectangle description with left, top, right, bottom, width and height
*/
export default function getRelativeBoundingRect (els, containerEl) {
  let nativeCotainerEl
  if (containerEl._isDOMElement) {
    nativeCotainerEl = containerEl.getNativeElement()
  } else {
    nativeCotainerEl = containerEl
  }
  if (!isArray(els)) els = [els]
  let elRects = els.map((el) => {
    let nativeEl
    if (el._isDOMElement) {
      nativeEl = el.getNativeElement()
    } else {
      nativeEl = el
    }
    return _getBoundingOffsetsRect(nativeEl, nativeCotainerEl)
  })

  let elsRect = _getBoundingRect(elRects)
  let containerElRect = nativeCotainerEl.getBoundingClientRect()
  return {
    left: elsRect.left,
    top: elsRect.top,
    right: containerElRect.width - elsRect.left - elsRect.width,
    bottom: containerElRect.height - elsRect.top - elsRect.height,
    width: elsRect.width,
    height: elsRect.height
  }
}

/*
  Calculate a bounding rectangle for a set of rectangles.

  Note: Here, `bounds.right` and `bounds.bottom` are relative to
  the left top of the viewport.

  @param {object[]}
*/
function _getBoundingRect (rects) {
  var bounds = {
    left: Number.POSITIVE_INFINITY,
    top: Number.POSITIVE_INFINITY,
    right: Number.NEGATIVE_INFINITY,
    bottom: Number.NEGATIVE_INFINITY,
    width: Number.NaN,
    height: Number.NaN
  }

  forEach(rects, function (rect) {
    if (rect.left < bounds.left) {
      bounds.left = rect.left
    }
    if (rect.top < bounds.top) {
      bounds.top = rect.top
    }
    if (rect.left + rect.width > bounds.right) {
      bounds.right = rect.left + rect.width
    }
    if (rect.top + rect.height > bounds.bottom) {
      bounds.bottom = rect.top + rect.height
    }
  })
  bounds.width = bounds.right - bounds.left
  bounds.height = bounds.bottom - bounds.top
  return bounds
}

/*
  Calculate the bounding rect of a single element relative to a parent.

  The rectangle dimensions are calculated as the union of the given elements
  clientRects. A selection fragment, for example, may appear as a multi-line span
  element that consists of a single client rect per line of text in variable widths.

  @param {HTMLElement} el native DOM element to get the bounding rectangle for
  @param {HTMLElement} relativeParentEl native DOM element used as a reference point
*/
function _getBoundingOffsetsRect (el, relativeParentEl) {
  var relativeParentElRect = relativeParentEl.getBoundingClientRect()
  var elRect = _getBoundingRect(el.getClientRects())

  var left = elRect.left - relativeParentElRect.left
  var top = elRect.top - relativeParentElRect.top
  return {
    left: left,
    top: top,
    right: relativeParentElRect.width - left - elRect.width,
    bottom: relativeParentElRect.height - top - elRect.height,
    width: elRect.width,
    height: elRect.height
  }
}
