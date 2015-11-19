'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');

function TestNode() {
  TestNode.super.apply(this, arguments);
}

oo.inherit(TestNode, DocumentNode);

TestNode.static.name = "test-node";

TestNode.static.defineSchema({
  boolVal: { type: "boolean", default: false },
  stringVal: { type: "string", default: "" },
  arrayVal: { type: ["array","string"], default: [] },
  objectVal: { type: "object", default: {} },
});

TestNode.static.blockType = true;

module.exports = TestNode;
