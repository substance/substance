export default function compareCoordinates (doc, containerPath, coor1, coor2) {
  let address1 = _getContainerAddress(doc, containerPath, coor1)
  let address2 = _getContainerAddress(doc, containerPath, coor2)
  let L = Math.min(address1.length, address2.length)
  for (let level = 0; level < L; level++) {
    let p1 = address1[level]
    let p2 = address2[level]
    if (p1 < p2) return -1
    if (p1 > p2) return 1
  }
  return 0
}

function _getContainerAddress (doc, containerPath, coor) {
  let containerId = containerPath[0]
  let nodeId = coor.path[0]
  let node = doc.get(nodeId)
  let xpath = node.getXpath()
  let address = []
  while (xpath) {
    if (xpath.id === containerId) return address
    address.unshift(xpath.pos || 0)
    xpath = xpath.prev
  }
}
