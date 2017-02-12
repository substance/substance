import deleteFromArray from './deleteFromArray'

// simplified version of TreeIndex for arrays
class ArrayTree {
  add(path, val) {
    if (!this[path]) {
      this[path] = []
    }
    this[path].push(val)
  }
  remove(path, val) {
    if (this[path]) {
      deleteFromArray(this[path], val)
    }
  }
}

export default ArrayTree