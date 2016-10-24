export default function map(iteratee, func) {
  if (!iteratee) return []
  if (!func) func = function(item) { return item }
  if (Array.isArray(iteratee)) {
    return iteratee.map(func)
  } else if (typeof iteratee.length !== 'undefined') {
    let l = iteratee.length
    let result = []
    for (var i = 0; i < l; i++) {
      result.push(func(iteratee[i], i))
    }
    return result
  } else {
    return Object.keys(iteratee).map(function(key) {
      return func(iteratee[key], key)
    })
  }
}
