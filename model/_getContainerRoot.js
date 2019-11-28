export default function getContainerRoot (doc, containerPath, nodeId) {
  let current = doc.get(nodeId)
  const containerId = containerPath[0]
  while (current) {
    const parent = current.getParent()
    if (parent && parent.id === containerId) {
      return current
    }
    current = parent
  }
}
