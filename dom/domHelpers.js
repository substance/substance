import DefaultDOMElement from './DefaultDOMElement'

export function findParentDOMElement(nativeEl) {
  while(nativeEl) {
    let el = DefaultDOMElement.unwrap(nativeEl)
    if (el) return el
    nativeEl = nativeEl.parentNode
  }
}

export function findParent(el, selector) {
  while(el) {
    if (el.is(selector)) return el
    el = el.getParent()
  }
}

export function stop(event) {
  event.stopPropagation()
}

export function stopAndPrevent(event) {
  event.stopPropagation()
  event.preventDefault()
}

export function walk(el, cb) {
  _walk(el, cb, 0)
}

function _walk(el, cb, level) {
  cb(el, level)
  if (el.getChildCount() > 0) {
    let it = el.getChildNodeIterator()
    while(it.hasNext()) {
      _walk(it.next(), cb, level+1)
    }
  }
}

export function isRightButton(event) {
  let isRightButton = false
  if (event.hasOwnProperty("which")) {
    isRightButton = (event.which === 3)
  } else if (event.hasOwnProperty("button")) {
    isRightButton = (event.button === 2)
  }
  return isRightButton
}

export function getBoundingRect(el) {
  let _rect = el.getNativeElement().getBoundingClientRect()
  return {
    top: _rect.top,
    left: _rect.left,
    height: _rect.height,
    width: _rect.width
  }
}

export function isXInside(x, rect) {
  return x >= rect.left && x <= rect.left+rect.width
}

export function isYInside(y, rect) {
  return y >= rect.top && y <= rect.top+rect.height
}
