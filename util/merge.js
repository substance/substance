// TODO: rename this module to avoid confusion with lodash-es/merge
import merge from 'lodash-es/merge'
import mergeWith from 'lodash-es/mergeWith'
import isArray from './isArray'

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

/**
  Same as lodash/merge except that it provides options how to
  treat arrays.

  The default implementation overwrites elements.
   get concatenated rather than overwritten.
*/
export default function(a, b, options) {
  options = options || {}
  var _with = null
  if (options.array === 'replace') {
    _with = _replaceArrays
  } else if (options.array === 'concat') {
    _with = _concatArrays
  }
  if (_with) {
    return mergeWith(a, b, _with)
  } else {
    return merge(a, b)
  }
}
