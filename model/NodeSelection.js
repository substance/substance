'use strict';

var isString = require('lodash/isString');
var Selection = require('./Selection');
var Coordinate = require('./Coordinate');

function NodeSelection(containerId, nodeId, mode, reverse) {
  Selection.call(this);

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
}

NodeSelection.Prototype = function() {

  this._isNodeSelection = true;

  var _super = NodeSelection.super.prototype;

  this.equals = function(other) {
    return (
      _super.call(this, other) &&
      this.nodeId === other.nodeId &&
      this.mode === other.mode
    );
  };

  this.isNodeSelection = function() {
    return true;
  };

  this.getType = function() {
    return 'node';
  };

  this.getNodeId = function() {
    return this.nodeId;
  };

  this.isFull = function() {
    return this.mode === 'full';
  };

  this.isBefore = function() {
    return this.mode === 'before';
  };

  this.isAfter = function() {
    return this.mode === 'after';
  };

  this.isCollapsed = function() {
    return this.mode !== 'full';
  };

  this.toJSON = function() {
    return {
      containerId: this.containerId,
      nodeId: this.nodeId,
      mode: this.mode,
      reverse: this.reverse
    };
  };

  this._getCoordinate = function() {
    if (this.mode === 'before') {
      return new Coordinate([this.nodeId], 0);
    } else if (this.mode === 'after') {
      return new Coordinate([this.nodeId], 1);
    }
  };

};

Selection.extend(NodeSelection);

NodeSelection.fromJSON = function(json) {
  return new NodeSelection(json.containerId, json.nodeId, json.mode, json.reverse);
};

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

module.exports = NodeSelection;
