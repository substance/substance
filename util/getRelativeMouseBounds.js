/**
  Get bounding bounds for a given mouse event, relative parent element.

  @param {MouseEvent} mouseEvent the source mouse event
  @param {DOMElement} containerEl used as a reference point to calculate position
  @return {object} bound description with left, top, right, bottom
*/
export default function getRelativeMouseBounds (mouseEvent, containerEl) {
  const containerElRect = containerEl.getBoundingClientRect()
  const left = mouseEvent.clientX - containerElRect.left
  const top = mouseEvent.clientY - containerElRect.top
  const res = {
    left: left,
    right: containerElRect.width - left,
    top: top,
    bottom: containerElRect.height - top
  }
  return res
}
