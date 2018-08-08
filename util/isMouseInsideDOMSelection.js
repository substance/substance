export default function isMouseInsideDOMSelection (event) {
  let wsel = window.getSelection()
  if (wsel.rangeCount === 0) {
    return false
  }
  let wrange = wsel.getRangeAt(0)
  let selectionRect = wrange.getBoundingClientRect()
  return event.clientX >= selectionRect.left &&
         event.clientX <= selectionRect.right &&
         event.clientY >= selectionRect.top &&
         event.clientY <= selectionRect.bottom
}
