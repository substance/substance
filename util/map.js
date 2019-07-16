export default function map (iteratee, func) {
  if (!iteratee) return []
  if (!func) func = function (item) { return item }
  if (Array.isArray(iteratee)) {
    return iteratee.map(func)
  }
  if (iteratee instanceof Map) {
    let result = []
    for (let [name, val] of iteratee) {
      result.push(func(val, name))
    }
    return result
  }
  if (iteratee instanceof Set) {
    let result = []
    let idx = 0
    iteratee.forEach(item => {
      result.push(func(item, idx++))
    })
    return result
  }
  return Object.keys(iteratee).map(function (key) {
    return func(iteratee[key], key)
  })
}
