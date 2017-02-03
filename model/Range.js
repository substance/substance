import isPlainObject from '../util/isPlainObject'

class Range {

  constructor(start, end, reverse, containerId, surfaceId) {
    // HACK: to allow this class be inherited but without calling this ctor
    if (arguments[0] === 'SKIP') return
    if (arguments.length === 1 && isPlainObject(arguments[0])) {
      let data = arguments[0]
      this.start = data.start
      this.end = data.end
      this.reverse = Boolean(data.reverse)
      this.containerId = data.containerId
      this.surfaceId = data.surfaceId
    } else {
      this.start = start
      this.end = end
      this.reverse = Boolean(reverse)
      this.containerId = containerId
      this.surfaceId = surfaceId
    }
  }

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
    let str = [this.start.toString(), '->', this.end.toString()]
    if (this.isReverse()) {
      str.push('[reverse]')
    }
    if (this.containerId) {
      str.push('[container='+this.containerId+']')
    }
    if (this.surfaceId) {
      str.push('[surface='+this.surfaceId+']')
    }
    return str.join('')
  }

}

Range.prototype._isRange = true

export default Range
