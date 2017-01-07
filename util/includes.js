export default includes(arr, val) {
  if (!arr) return false
  return (arr.indexOf(val) >= 0)
}