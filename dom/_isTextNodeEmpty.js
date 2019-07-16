export default function _isTextNodeEmpty (el) {
  return Boolean(/^\s*$/.exec(el.textContent))
}
