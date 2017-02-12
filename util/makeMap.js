export default function makeMap(keys) {
  return keys.reduce(function(obj, key) {
    obj[key] = true
    return obj
  }, {})
}
