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