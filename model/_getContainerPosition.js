import getContainerRoot from './_getContainerRoot'

export default function getContainerPosition (doc, containerPath, nodeId) {
  const node = getContainerRoot(doc, containerPath, nodeId)
  return node.getPosition()
}
