export default function isMouseInsideDOMSelection (event) {
  const wsel = window.getSelection()
  if (wsel.rangeCount === 0) {
    return false
  }
  const wrange = wsel.getRangeAt(0)
  const selectionRect = wrange.getBoundingClientRect()
  return event.clientX >= selectionRect.left &&
         event.clientX <= selectionRect.right &&
         event.clientY >= selectionRect.top &&
         event.clientY <= selectionRect.bottom
}
