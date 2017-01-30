export default function getListTagName(node) {
  // TODO: we might want to have different types for different levels
  return node.ordered ? 'ol' : 'ul'
}