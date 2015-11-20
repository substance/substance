'use strict';

var DocumentNode = require('../../model/DocumentNode');

function StructuredNode() {
  StructuredNode.super.apply(this, arguments);
}

DocumentNode.extend(StructuredNode);

StructuredNode.static.name = "structured-node";
StructuredNode.static.defineSchema({
  title: "text",
  body: "text",
  caption: "text"
});

StructuredNode.static.isBlock = true;

module.exports = StructuredNode;
