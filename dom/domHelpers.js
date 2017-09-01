import DefaultDOMElement from './DefaultDOMElement'

export function findParentDOMElement(nativeEl) {
  while(nativeEl) {
    let el = DefaultDOMElement.unwrap(nativeEl)
    if (el) return el
    nativeEl = nativeEl.parentNode
  }
}
