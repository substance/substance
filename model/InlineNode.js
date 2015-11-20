'use strict';

var PropertyAnnotation = require('./PropertyAnnotation');

function InlineNode() {
  InlineNode.super.apply(this, arguments);
}

PropertyAnnotation.extend(InlineNode);

InlineNode.static.isInline = true;

module.exports = InlineNode;
