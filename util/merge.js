// TODO: rename this module to avoid confusion with lodash-es/merge
import _merge from 'lodash-es/merge'
import _mergeWith from 'lodash-es/mergeWith'
import isArray from './isArray'

/**
  Same as lodash/merge except that it provides options how to
  treat arrays.

  The default implementation overwrites elements.
   get concatenated rather than overwritten.
*/
export default function merge(a, b, options) {
  options = options || {}
  var _with = null
  if (options.array === 'replace') {
    _with = _replaceArrays
  } else if (options.array === 'concat') {
    _with = _concatArrays
  }
  if (_with) {
    return _mergeWith(a, b, _with)
  } else {
    return _merge(a, b)
  }
}

function _concatArrays(objValue, srcValue) {
  if (isArray(objValue)) {
    return objValue.concat(srcValue)
  } else {
    return null
  }
}

function _replaceArrays(objValue, srcValue) {
  if (isArray(objValue)) {
    return srcValue
  } else {
    return null
  }
}
