import isObject from './isObject'
import isArray from './isArray'
import forEach from './forEach'
import inBrowser from './inBrowser'

function cloneDeep(val) {
  if (isArray(val)) {
    return _cloneArrayDeep(val);
  }
  // HACK: should we clone Files?
  // ATM we only use it when creating FileNodes
  // where the File instance is actually not serialized
  if (inBrowser && val instanceof window.File) {
    return val
  }
  if (isObject(val)) {
    return _cloneObjectDeep(val)
  }
  // primitives don't need to be cloned
  // TODO: is that ok?
  return val
}

function _cloneObjectDeep(obj) {
  let res = {}
  forEach(obj, (val, key) => {
    res[key] = cloneDeep(val)
  })
  return res
}

function _cloneArrayDeep(arr) {
  return arr.map(cloneDeep)
}

export default cloneDeep