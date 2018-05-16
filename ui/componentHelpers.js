import Component from './Component'

/*
  Looks for the first parent Component instance for a give´n native element.
*/
export function findParentComponent (el) {
  while (el) {
    const comp = Component.unwrap(el)
    if (comp) return comp
    el = el.parentNode
  }
}
