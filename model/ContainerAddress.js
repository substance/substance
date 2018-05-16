class ContainerAddress {
  constructor (pos, offset) {
    this.pos = pos
    this.offset = offset
  }

  isBefore (other, strict) {
    strict = Boolean(strict)
    if (this.pos < other.pos) {
      return true
    } else if (this.pos > other.pos) {
      return false
    } else if (this.offset < other.offset) {
      return true
    } else if (this.offset > other.offset) {
      return false
    }
    if (strict) {
      return false
    } else {
      return true
    }
  }

  isAfter (other, strict) {
    return other.isBefore(this, strict)
  }

  isEqual (other) {
    return (this.pos === other.pos && this.offset === other.offset)
  }

  toString () {
    return [this.pos, '.', this.offset].join('')
  }
}

export default ContainerAddress
