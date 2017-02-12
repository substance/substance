import isArray from './isArray'
export default function isArrayEqual(arr1, arr2) {
  if (arr1 === arr2) return true
  if (!isArray(arr1) || !isArray(arr2)) return false
  if (arr1.length !== arr2.length) return false
  let L = arr1.length
  for (var i = 0; i < L; i++) {
    if (arr1[i] !== arr2[i]) return false
  }
  return true
}