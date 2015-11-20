'use strict';

var DocumentNode = require('../../model/DocumentNode');

function TestMetaNode() {
  TestMetaNode.super.apply(this, arguments);
}

DocumentNode.extend(TestMetaNode);

TestMetaNode.static.name = "meta";

TestMetaNode.static.defineSchema({
  "title": "text"
});

module.exports = TestMetaNode;
