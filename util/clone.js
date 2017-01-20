import isObject from './isObject'
import isArray from './isArray'

function clone(val) {
  if (isArray(val)) {
    return val.slice(0)
  }
  if (isObject(val)) {
    return Object.assign({}, val)
  }
  // we do not clone primitives
  // TODO: is that ok?
  return val
}

export default clone