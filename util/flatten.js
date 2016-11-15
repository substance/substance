export default function flatten(arr) {
  return Array.prototype.concat.call([], arr)
}
