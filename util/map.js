export default function map(iteratee, func) {
  if (!iteratee) return []
  if (iteratee.map) {
    return iteratee.map(func)
  } else {
    return Object.keys(iteratee).map(function(key) {
      return func(iteratee[key], key)
    })
  }
}
