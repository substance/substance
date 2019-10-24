export function getLabel (node) {
  let label = node.label
  if (node && node.state) {
    label = node.state.label || label
  }
  return label
}
