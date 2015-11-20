'use strict';

var DocumentNode = require('./DocumentNode');

function BlockNode() {
  BlockNode.super.apply(this, arguments);
}
DocumentNode.extend(BlockNode);

BlockNode.static.blockType = true;

module.exports = BlockNode;
