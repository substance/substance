'use strict';

var extend = require('lodash/extend');
var isNumber = require('lodash/isNumber');
var error = require('../util/error');
var warn = require('../util/warn');
var DocumentNode = require('./DocumentNode');
var ParentNodeMixin = require('./ParentNodeMixin');
var ContainerAddress = require('./ContainerAddress');

/**
  A Container represents a list of nodes.

  While most editing occurs on a property level (such as editing text),
  other things happen on a node level, e.g., breaking or mergin nodes,
  or spanning annotations or so called ContainerAnnotations.

  @prop {String[]} nodes

  @example
*/
function Container() {
  Container.super.apply(this, arguments);

  // NOTE: we are caching things in this implementation
  // which we invalidate on every change
  // TODO: do we really need to invalidate on every change?
  // or just container changes?
  if (!this.document.isTransactionDocument) {
    this.document.on('document:changed', this._onChange, this);
  }
}

Container.Prototype = function() {

  this._isContainer = true;

  extend(this, ParentNodeMixin);

  this.dispose = function() {
    this.document.off(this);
  };

  this.getPosition = function(nodeId) {
    // HACK: ATM we are caching only in the real Document
    // i.e., which is connected to the UI etc.
    if (this.document.isTransactionDocument) {
      return this.nodes.indexOf(nodeId);
    } else {
      var positions = this._getCachedPositions();
      var pos = positions[nodeId];
      if (pos === undefined) {
        pos = -1;
      }
      return pos;
    }
  };

  this.getNodes = function() {
    var doc = this.getDocument();
    var nodes = [];
    this.nodes.forEach(function(nodeId){
      var node = doc.get(nodeId);
      if (!node) {
        error('Node does not exist: ', nodeId);
      } else {
        nodes.push(node);
      }
    });
    return nodes;
  };

  this.show = function(nodeId, pos) {
    var doc = this.getDocument();
    if (!isNumber(pos)) {
      pos = this.nodes.length;
    }
    doc.update([this.id, 'nodes'], { insert: { offset: pos, value: nodeId } });
  };

  this.hide = function(nodeId) {
    var doc = this.getDocument();
    var pos = this.nodes.indexOf(nodeId);
    if (pos >= 0) {
      doc.update([this.id, 'nodes'], { delete: { offset: pos } });
    }
  };

  this.getAddress = function(coor) {
    if (!coor._isCoordinate) {
      // we have broken with an earlier version of this API
      throw new Error('Illegal argument: Container.getAddress(coor) expects a Coordinate instance.');
    }
    var nodeId = coor.path[0];
    var nodePos = this.getPosition(nodeId);
    var offset;
    if (coor.isNodeCoordinate()) {
      if (coor.offset > 0) {
        offset = Number.MAX_VALUE;
      } else {
        offset = 0;
      }
    } else {
      offset = coor.offset;
    }
    return new ContainerAddress(nodePos, offset);
  };

  this.getChildrenProperty = function() {
    return 'nodes';
  };

  this.getLength = function() {
    return this.nodes.length;
  };

  this._onChange = function(change) {
    if (change.isUpdated([this.id, 'nodes'])) {
      this.positions = null;
    }
  };

  this._getCachedPositions = function() {
    if (!this.positions) {
      var positions = {};
      this.nodes.forEach(function(id, pos) {
        positions[id] = pos;
      });
      this.positions = positions;
    }
    return this.positions;
  };

};

DocumentNode.extend(Container);

Container.static.name = "container";

Container.static.defineSchema({
  nodes: { type: ['id'], default: [] }
});

Object.defineProperty(Container.prototype, 'length', {
  get: function() {
    warn('DEPRECATED: want to get rid of unnecessary properties. Use this.getLength() instead.');
    return this.nodes.length;
  }
});

module.exports = Container;
