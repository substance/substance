import flatten from './flatten'

export default function flattenOften(arr, max) {
  if (!(max > 0)) throw new Error("'max' must be a positive number")
  let l = arr.length
  arr = flatten(arr)
  let round = 1
  while (round < max && l < arr.length) {
    l = arr.length
    arr = flatten(arr)
    round++
  }
  return arr
}