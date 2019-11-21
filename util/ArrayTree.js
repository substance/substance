import deleteFromArray from './deleteFromArray'
import getKeyForPath from './getKeyForPath'
import isString from './isString'

// simplified version of TreeIndex for arrays
export default class ArrayTree {
  add (path, val) {
    const key = this._getKey(path)
    if (!this[key]) {
      this[key] = []
    }
    this[key].push(val)
  }

  remove (path, val) {
    const key = this._getKey(path)
    if (this[key]) {
      deleteFromArray(this[key], val)
    }
  }

  get (path) {
    const key = this._getKey(path)
    return this[key] || []
  }

  _getKey (path) {
    if (isString) {
      return path
    } else {
      return getKeyForPath(path)
    }
  }
}
