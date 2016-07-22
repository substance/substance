'use strict';

var DocumentNode = require('../../model/DocumentNode');

function StructuredNode() {
  StructuredNode.super.apply(this, arguments);
}

DocumentNode.extend(StructuredNode);

StructuredNode.define({
  type: "structured-node",
  title: "text",
  body: "text",
  caption: "text"
});

StructuredNode.isBlock = true;

module.exports = StructuredNode;
