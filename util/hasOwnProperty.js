export default function hasOwnProperty (obj, propName) {
  return Object.prototype.hasOwnProperty.call(obj, propName)
}
