import isPlainObject from '../util/isPlainObject'

class Range {

  constructor(start, end, reverse, containerId) {
    // HACK: to allow this class be inherited but without calling this ctor
    if (arguments[0] === 'SKIP') return
    if (arguments.length === 1 && isPlainObject(arguments[0])) {
      let data = arguments[0]
      this.start = data.start
      this.end = data.end
      this.reverse = Boolean(data.reverse)
      this.containerId = data.containerId
    } else {
      this.start = start
      this.end = end
      this.reverse = Boolean(reverse)
      this.containerId = containerId
    }
  }

  get _isRange() { return true }

  isCollapsed() {
    return this.start.equals(this.end)
  }

  equals(other) {
    if (this === other) return true
    else {
      return (
        this.containerId === other.containerId &&
        this.start.equals(other.start) &&
        this.end.equals(other.end)
      )
    }
  }

  isReverse() {
    return this.reverse
  }

  toString() {
    var str = [this.start.toString(), '->', this.end.toString()]
    if (this.isReverse()) {
      str.push('(reverse)')
    }
    return str.join('')
  }

}

export default Range
