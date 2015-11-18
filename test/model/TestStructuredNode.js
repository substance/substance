'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');

function StructuredNode() {
  StructuredNode.super.apply(this, arguments);
}

oo.inherit(StructuredNode, DocumentNode);

StructuredNode.static.name = "structured-node";

StructuredNode.static.defineSchema({
  title: "text",
  body: "text",
  caption: "text"
});

StructuredNode.static.blockType = true;

module.exports = StructuredNode;
