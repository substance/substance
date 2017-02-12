export default function deleteFromArray(array, value) {
  if (!array) return
  for (var i = 0; i < array.length; i++) {
    if (array[i] === value) {
      array.splice(i, 1)
      i--
    }
  }
}
