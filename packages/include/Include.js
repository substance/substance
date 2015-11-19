'use strict';

var oo = require('../../util/oo');
var BlockNode = require('../../model/BlockNode');

function Include() {
  Include.apply(this, arguments);
}

Include.Prototype = function() {

  this.getIncludedNode = function() {
    return this.getDocument().get(this.nodeId);
  };

};

oo.inherit(Include, BlockNode);

Include.static.name = "include";

Include.static.defineSchema({
  "nodeType": "string",
  "nodeId": "id"
});

module.exports = Include;
