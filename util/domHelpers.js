/*
  These helpers would be useful.
*/

/*
  Retrieves the attached DOMElement instance from a nativeEl, if present.
*/
export function unwrapDOMElement(nativeEl) {
  return nativeEl._wrapper
}

/*
  Retrieves the attached Component instance from a nativeEl, if present.
*/
export function unwrapComponent(nativeEl) {
  if (nativeEl._wrapper) {
    return nativeEl._wrapper._comp
  }
}

/*
  Looks for the first parent Component instance for a give´n native element.
*/
export function findParentComponent(el) {
  while (el) {
    const comp = unwrapComponent(el)
    if (comp) return comp
    el = el.parentNode
  }
}