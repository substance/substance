'use strict';

var BlockNode = require('../../model/BlockNode');

var Include = BlockNode.extend();

Include.static.name = "include";

Include.static.schema = {
  "nodeType": { type: "string" },
  "nodeId": { type: "id" }
};

Include.prototype.getIncludedNode = function() {
  return this.getDocument().get(this.nodeId);
};

module.exports = Include;
