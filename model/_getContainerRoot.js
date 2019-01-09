export default function getContainerRoot (doc, containerPath, nodeId) {
  let current = doc.get(nodeId)
  let containerId = containerPath[0]
  while (current) {
    let parent = current.getParent()
    if (parent && parent.id === containerId) {
      return current
    }
    current = parent
  }
}
