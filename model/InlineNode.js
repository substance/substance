'use strict';

var PropertyAnnotation = require('./PropertyAnnotation');

function InlineNode() {
  InlineNode.super.apply(this, arguments);
}

PropertyAnnotation.extend(InlineNode);

InlineNode.isInline = true;

module.exports = InlineNode;
