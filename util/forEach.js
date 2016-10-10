export default function forEach(iteratee, func) {
  if (!iteratee) return
  if (iteratee.constructor.prototype.forEach) {
    iteratee.forEach(func)
  } else {
    Object.keys(iteratee).forEach(function(key) {
      return func(iteratee[key], key)
    })
  }
}
