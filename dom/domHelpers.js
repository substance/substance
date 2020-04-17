import DefaultDOMElement from './DefaultDOMElement'

export function findParentDOMElement (nativeEl) {
  while (nativeEl) {
    const el = DefaultDOMElement.unwrap(nativeEl)
    if (el) return el
    nativeEl = nativeEl.parentNode
  }
}

export function findParent (el, selector) {
  while (el) {
    if (el.is(selector)) return el
    el = el.getParent()
  }
}

export function hasAncestor (el, ancestor) {
  while (el) {
    if (el === ancestor) return true
    el = el.getParent()
  }
  return false
}

export function findChild (el, cssSelector) {
  const children = el.getChildren()
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.is(cssSelector)) return child
  }
}

export function findAllChildren (el, cssSelector) {
  const children = el.getChildren()
  const result = []
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.is(cssSelector)) {
      result.push(child)
    }
  }
  return result
}

export function stop (event) {
  event.stopPropagation()
}

export function stopAndPrevent (event) {
  event.stopPropagation()
  event.preventDefault()
}

export function walk (el, cb) {
  _walk(el, cb, 0)
}

function _walk (el, cb, level) {
  cb(el, level)
  if (el.getChildCount() > 0) {
    const it = el.getChildNodeIterator()
    while (it.hasNext()) {
      _walk(it.next(), cb, level + 1)
    }
  }
}

export function isRightButton (event) {
  let isRightButton = false
  if ('which' in event) {
    isRightButton = (event.which === 3)
  } else if ('button' in event) {
    isRightButton = (event.button === 2)
  }
  return isRightButton
}

export function getBoundingRect (el) {
  const _rect = el.getNativeElement().getBoundingClientRect()
  return {
    top: _rect.top,
    left: _rect.left,
    height: _rect.height,
    width: _rect.width
  }
}

export function getBoundingRectForRects (...rects) {
  let top, left, bottom, right
  if (rects.length > 0) {
    const first = rects[0]
    top = first.top
    left = first.left
    bottom = top + first.height
    right = left + first.width
    for (let i = 1; i < rects.length; i++) {
      const r = rects[i]
      top = Math.min(top, r.top)
      left = Math.min(left, r.left)
      bottom = Math.max(bottom, r.top + r.height)
      right = Math.max(right, r.left + r.width)
    }
  }
  return {
    top,
    left,
    right,
    bottom,
    height: bottom - top,
    width: right - left
  }
}

export function isXInside (x, rect) {
  return x >= rect.left && x <= rect.left + rect.width
}

export function isYInside (y, rect) {
  return y >= rect.top && y <= rect.top + rect.height
}
