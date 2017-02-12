/*
  An iterator for arrays.

  @class
  @param {Array} arr
 */
class ArrayIterator {

  constructor(arr) {
    this.arr = arr
    this.pos = -1
  }

  get _isArrayIterator() {
    return true
  }

  /**
    @returns {Boolean} true if there is another child node left.
   */
  hasNext() {
    return this.pos < this.arr.length - 1
  }

  /**
    Increments the iterator providing the next child node.

    @returns {HTMLElement} The next child node.
   */
  next() {
    this.pos += 1
    var next = this.arr[this.pos]
    return next
  }

  /**
    Decrements the iterator.
   */
  back() {
    if (this.pos >= 0) {
      this.pos -= 1
    }
    return this
  }
}

export default ArrayIterator
