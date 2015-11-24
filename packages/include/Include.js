'use strict';

var BlockNode = require('../../model/BlockNode');

function Include() {
  Include.apply(this, arguments);
}

BlockNode.extend(Include, function IncludePrototype() {
  this.getIncludedNode = function() {
    return this.getDocument().get(this.nodeId);
  };
});

Include.static.name = "include";

Include.static.defineSchema({
  "nodeType": "string",
  "nodeId": "id"
});

module.exports = Include;
