export default function array2table(keys) {
  return keys.reduce((obj, key) => {
    obj[key] = true
    return obj
  }, {})
}
