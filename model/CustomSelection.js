import cloneDeep from '../util/cloneDeep'
import isEqual from '../util/isEqual'
import Selection from './Selection'

export default class CustomSelection extends Selection {
  constructor (customType, data, nodeId, surfaceId) {
    super()

    if (arguments.length === 1) {
      let _data = arguments[0]
      customType = _data.customType
      data = _data.data
      nodeId = _data.nodeId
      surfaceId = _data.surfaceId
    }

    if (!customType) { throw new Error("'customType' is required") }
    if (!nodeId) { throw new Error("'nodeId' is required") }

    this.customType = customType
    this.data = data || {}
    this.nodeId = nodeId
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

  /**
   * Provide the id of the node which is responsible for this selection.
   * E.g. a table selection is interpreted by a specific table.
   */
  getNodeId () {
    return this.nodeId
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
