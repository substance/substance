import getContainerRoot from './_getContainerRoot'

export default function getContainerPosition (doc, containerPath, nodeId) {
  let node = getContainerRoot(doc, containerPath, nodeId)
  return node.getPosition()
}
