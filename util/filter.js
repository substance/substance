import isFunction from './isFunction'
import forEach from './forEach'

export default function filter(iteratee, fn) {
  if (!iteratee) return []
  if (iteratee.constructor.prototype.filter && isFunction(iteratee.constructor.prototype.filter)) {
    return iteratee.filter(fn)
  }
  let result = []
  forEach(iteratee, (val, key) => {
    if (fn(val, key)) {
      result.push(val)
    }
  })
  return result
}