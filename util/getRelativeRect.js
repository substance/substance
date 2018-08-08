export default function getRelativeRect (parentRect, childRect) {
  var left = childRect.left - parentRect.left
  var top = childRect.top - parentRect.top
  return {
    left: left,
    top: top,
    right: parentRect.width - left - childRect.width,
    bottom: parentRect.height - top - childRect.height,
    width: childRect.width,
    height: childRect.height
  }
}
