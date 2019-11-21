import compareCoordinates from './_compareCoordinates'

export default function isCoordinateBefore (doc, containerPath, coor1, coor2, strict) {
  const cmp = compareCoordinates(doc, containerPath, coor1, coor2)
  if (strict) {
    return cmp < 0
  } else {
    return cmp <= 0
  }
}
