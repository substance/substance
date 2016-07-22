'use strict';

var DocumentNode = require('./DocumentNode');

function BlockNode() {
  BlockNode.super.apply(this, arguments);
}

DocumentNode.extend(BlockNode);

BlockNode.isBlock = true;

module.exports = BlockNode;
