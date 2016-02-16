'use strict';
var Selection = require('./Selection');

function NodeSelection(nodeId) {
  this.nodeId = nodeId;
}

NodeSelection.Prototype = function() {

  this.isNodeSelection = function() {
    return true;
  };

  this.isCollapsed = function() {
    return false;
  };

};

Selection.extend(NodeSelection);

module.exports = NodeSelection;
