import cloneDeep from '../util/cloneDeep'
import isEqual from '../util/isEqual'
import Selection from './Selection'

export default class CustomSelection extends Selection {
  constructor (customType, data, surfaceId) {
    super()

    if (arguments.length === 1) {
      let _data = arguments[0]
      customType = _data.customType
      data = _data.data
      surfaceId = _data.surfaceId
    }

    this.customType = customType
    this.data = data || {}
    this.surfaceId = surfaceId
  }

  isCustomSelection () {
    return true
  }

  getType () {
    return 'custom'
  }

  getCustomType () {
    return this.customType
  }

  toJSON () {
    return {
      type: 'custom',
      customType: this.customType,
      data: cloneDeep(this.data),
      surfaceId: this.surfaceId
    }
  }

  toString () {
    /* istanbul ignore next */
    return [
      'CustomSelection(',
      this.customType, ', ',
      JSON.stringify(this.data),
      ')'
    ].join('')
  }

  equals (other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      other.isCustomSelection() &&
      isEqual(this.data, other.data)
    )
  }

  _clone () {
    return new CustomSelection(this)
  }

  get _isCustomSelection () { return true }

  static fromJSON (data) {
    return new CustomSelection(data)
  }
}
