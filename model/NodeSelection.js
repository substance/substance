import isString from '../util/isString'
import Selection from './Selection'
import Coordinate from './Coordinate'

class NodeSelection extends Selection {

  constructor(containerId, nodeId, mode, reverse, surfaceId) {
    super()

    if (arguments.length === 1) {
      let data = arguments[0]
      containerId = data.containerId
      nodeId = data.nodeId
      mode = data.mode
      reverse = data.reverse
      surfaceId = data.surfaceId
    }

    if (!isString(containerId)) {
      throw new Error("'containerId' is mandatory.");
    }
    if (!isString(nodeId)) {
      throw new Error("'nodeId' is mandatory.");
    }
    if (['full', 'before', 'after'].indexOf(mode) < 0) {
      throw new Error("'mode' is mandatory.");
    }

    this.containerId = containerId;
    this.nodeId = nodeId;
    this.mode = mode;
    this.reverse = Boolean(reverse);
    this.surfaceId = surfaceId;
  }

  // for duck-typed instanceof
  get _isNodeSelection() { return true }


  equals(other) {
    return (
      super.equals(other) &&
      this.nodeId === other.nodeId &&
      this.mode === other.mode
    )
  }

  isNodeSelection() {
    return true;
  }

  getType() {
    return 'node';
  }

  getNodeId() {
    return this.nodeId;
  }

  isFull() {
    return this.mode === 'full';
  }

  isBefore() {
    return this.mode === 'before';
  }

  isAfter() {
    return this.mode === 'after';
  }

  isCollapsed() {
    return this.mode !== 'full';
  }

  toJSON() {
    return {
      containerId: this.containerId,
      nodeId: this.nodeId,
      mode: this.mode,
      reverse: this.reverse,
      surfaceId: this.surfaceId
    };
  }

  toString() {
    /* istanbul ignore next */
    return [
      "NodeSelection(",
      this.containerId, ".", this.nodeId, ", ",
      this.mode, ", ",
      (this.reverse?", reverse":""),
      (this.surfaceId?(", "+this.surfaceId):""),
      ")"
    ].join('');
  }

  collapse(direction) {
    if (direction === 'left') {
      if (this.isBefore()) {
        return this;
      } else {
        return new NodeSelection(this.containerId, this.nodeId, 'before', this.reverse, this.surfaceId);
      }
    } else if (direction === 'right') {
      if (this.isAfter()) {
        return this;
      } else {
        return new NodeSelection(this.containerId, this.nodeId, 'after', this.reverse, this.surfaceId);
      }
    } else {
      throw new Error("'direction' must be either 'left' or 'right'");
    }
  }

  _getCoordinate() {
    if (this.mode === 'before') {
      return new Coordinate([this.nodeId], 0);
    } else if (this.mode === 'after') {
      return new Coordinate([this.nodeId], 1);
    }
  }

  _clone() {
    return new NodeSelection(this);
  }
}

NodeSelection.fromJSON = function(json) {
  return new NodeSelection(json);
}

NodeSelection._createFromRange = function(range) {
  var containerId = range.containerId;
  var nodeId = range.start.getNodeId();
  var startOffset = range.start.offset;
  var endOffset = range.end.offset;
  var reverse = range.reverse;
  var mode;
  if (startOffset === endOffset) {
    mode = startOffset === 0 ? 'before' : 'after';
  } else {
    mode = 'full';
  }
  return new NodeSelection(containerId, nodeId, mode, reverse);
};

NodeSelection._createFromCoordinate = function(coor) {
  var containerId = coor.containerId;
  var nodeId = coor.getNodeId();
  var mode = coor.offset === 0 ? 'before' : 'after';
  return new NodeSelection(containerId, nodeId, mode, false);
};

export default NodeSelection
