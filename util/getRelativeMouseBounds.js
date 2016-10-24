/**
  Get bounding bounds for a given mouse event, relative parent element.

  @param {MouseEvent} mouseEvent the source mouse event
  @param {DOMElement} containerEl used as a reference point to calculate position
  @return {object} bound description with left, top, right, bottom
*/
function getRelativeMouseBounds(mouseEvent, containerEl) {
  let containerElRect = containerEl.getBoundingClientRect()
  let left = mouseEvent.pageX - containerElRect.left
  let top = mouseEvent.pageY - containerElRect.top
  let res = {
    left: left,
    right: containerElRect.width - left,
    top: top,
    bottom: containerElRect.height - top
  }
  return res;
}

export default getRelativeMouseBounds