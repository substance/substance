import isFunction from './isFunction'

export default function findIndex(arr, predicate) {
  if (!isFunction(predicate)) return arr.indexOf(predicate)
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) return i
  }
  return -1
}