'use strict';

var DocumentNode = require('../../model/DocumentNode');

function TestNode() {
  TestNode.super.apply(this, arguments);
}

DocumentNode.extend(TestNode);

TestNode.static.name = "test-node";

TestNode.static.defineSchema({
  boolVal: { type: "boolean", default: false },
  stringVal: { type: "string", default: "" },
  arrayVal: { type: ["array","string"], default: [] },
  objectVal: { type: "object", default: {} },
});

TestNode.static.blockType = true;

module.exports = TestNode;
