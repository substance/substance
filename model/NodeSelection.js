import isArray from '../util/isArray'
import isString from '../util/isString'
import Selection from './Selection'
import Coordinate from './Coordinate'

export default class NodeSelection extends Selection {
  constructor (containerPath, nodeId, mode, reverse, surfaceId) {
    super()

    if (arguments.length === 1) {
      let data = arguments[0]
      containerPath = data.containerPath
      nodeId = data.nodeId
      mode = data.mode
      reverse = data.reverse
      surfaceId = data.surfaceId
    }

    if (!isArray(containerPath)) {
      throw new Error("'containerPath' is mandatory.")
    }
    if (!isString(nodeId)) {
      throw new Error("'nodeId' is mandatory.")
    }
    mode = mode || 'full'

    this.containerPath = containerPath
    this.nodeId = nodeId
    this.mode = mode
    this.reverse = Boolean(reverse)
    this.surfaceId = surfaceId

    this.start = new Coordinate([nodeId], 0)
    this.end = new Coordinate([nodeId], 1)
  }

  equals (other) {
    return (
      super.equals(other) &&
      this.nodeId === other.nodeId &&
      this.mode === other.mode
    )
  }

  isNodeSelection () {
    return true
  }

  getType () {
    return 'node'
  }

  getNodeId () {
    return this.nodeId
  }

  isFull () {
    return this.mode === 'full'
  }

  isBefore () {
    return this.mode === 'before'
  }

  isAfter () {
    return this.mode === 'after'
  }

  isCollapsed () {
    return this.mode !== 'full'
  }

  toJSON () {
    return {
      type: 'node',
      nodeId: this.nodeId,
      mode: this.mode,
      reverse: this.reverse,
      containerPath: this.containerPath,
      surfaceId: this.surfaceId
    }
  }

  toString () {
    /* istanbul ignore next */
    return [
      'NodeSelection(',
      this.containerPath, '.', this.nodeId, ', ',
      this.mode, ', ',
      (this.reverse ? ', reverse' : ''),
      (this.surfaceId ? (', ' + this.surfaceId) : ''),
      ')'
    ].join('')
  }

  collapse (direction) {
    if (direction === 'left') {
      if (this.isBefore()) {
        return this
      } else {
        return new NodeSelection(this.containerPath, this.nodeId, 'before', this.reverse, this.surfaceId)
      }
    } else if (direction === 'right') {
      if (this.isAfter()) {
        return this
      } else {
        return new NodeSelection(this.containerPath, this.nodeId, 'after', this.reverse, this.surfaceId)
      }
    } else {
      throw new Error("'direction' must be either 'left' or 'right'")
    }
  }

  _getCoordinate () {
    if (this.mode === 'before') {
      return new Coordinate([this.nodeId], 0)
    } else if (this.mode === 'after') {
      return new Coordinate([this.nodeId], 1)
    }
  }

  _clone () {
    return new NodeSelection(this)
  }

  static fromJSON (data) {
    return new NodeSelection(data)
  }

  get _isNodeSelection () { return true }
}
