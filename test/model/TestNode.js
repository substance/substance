'use strict';

var DocumentNode = require('../../model/DocumentNode');

function TestNode() {
  TestNode.super.apply(this, arguments);
}

DocumentNode.extend(TestNode);

TestNode.define({
  type: "test-node",
  boolVal: { type: "boolean", default: false },
  stringVal: { type: "string", default: "" },
  arrayVal: { type: ["array","string"], default: [] },
  objectVal: { type: "object", default: {} },
});

TestNode.isBlock = true;

module.exports = TestNode;
