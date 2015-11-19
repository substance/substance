'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');

function TestMetaNode() {
  TestMetaNode.super.apply(this, arguments);
}

oo.inherit(TestMetaNode, DocumentNode);

TestMetaNode.static.name = "meta";

TestMetaNode.static.defineSchema({
  "title": "text"
});

module.exports = TestMetaNode;
