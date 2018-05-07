import DefaultDOMElement from './DefaultDOMElement'

export function findParentDOMElement(nativeEl) {
  while(nativeEl) {
    let el = DefaultDOMElement.unwrap(nativeEl)
    if (el) return el
    nativeEl = nativeEl.parentNode
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