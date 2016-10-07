class Range {

  constructor(start, end, reverse, containerId) {
    // HACK: to allow this class be inherited but without calling this ctor
    if (arguments[0] === 'SKIP') return

    this.start = start
    this.end = end
    this.reverse = Boolean(reverse)
    this.containerId = containerId
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
