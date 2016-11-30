export default function isPlainObject(o) {
  if (!o) return false
  return o.constructor === Object
}