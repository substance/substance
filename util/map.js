export default function map(iteratee, func) {
  if (!iteratee) return []
  if (!func) func = function(item) { return item }
  if (Array.isArray(iteratee)) {
    return iteratee.map(func)
  } else {
    return Object.keys(iteratee).map(function(key) {
      return func(iteratee[key], key)
    })
  }
}
