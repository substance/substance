import isArray from './isArray'
import isFunction from './isFunction'
import forEach from './forEach'

function filter(iteratee, fn) {
  if (iteratee.constructor.prototype.filter && isFunction(iteratee.constructor.prototype.filter)) {
    return iteratee.filter(fn)
  }
  let result = []
  forEach(iteratee, (...args) => {
    result.push(fn(...args))
  })
  return result
}

export default filter