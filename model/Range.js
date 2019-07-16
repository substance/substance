import isPlainObject from '../util/isPlainObject'
import isArrayEqual from '../util/isArrayEqual'

export default class Range {
  constructor (start, end, reverse, containerPath, surfaceId) {
    // HACK: to allow this class be inherited but without calling this ctor
    if (arguments[0] === 'SKIP') return
    if (arguments.length === 1 && isPlainObject(arguments[0])) {
      let data = arguments[0]
      this.start = data.start
      this.end = data.end
      this.reverse = Boolean(data.reverse)
      this.containerPath = data.containerPath
      this.surfaceId = data.surfaceId
    } else {
      this.start = start
      this.end = end
      this.reverse = Boolean(reverse)
      this.containerPath = containerPath
      this.surfaceId = surfaceId
    }
  }

  isCollapsed () {
    return this.start.equals(this.end)
  }

  equals (other) {
    if (this === other) return true
    else {
      return (
        isArrayEqual(this.containerPath, other.containerPath) &&
        this.start.equals(other.start) &&
        this.end.equals(other.end)
      )
    }
  }

  isReverse () {
    return this.reverse
  }

  toString () {
    let str = [this.start.toString(), '->', this.end.toString()]
    if (this.isReverse()) {
      str.push('[reverse]')
    }
    if (this.containerPath) {
      str.push('[container=' + this.containerPath + ']')
    }
    if (this.surfaceId) {
      str.push('[surface=' + this.surfaceId + ']')
    }
    return str.join('')
  }

  // TODO: do we need this anymore?
  get _isRange () { return true }
}
