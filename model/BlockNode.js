'use strict';

var DocumentNode = require('./DocumentNode');

function BlockNode() {
  BlockNode.super.apply(this, arguments);
}

DocumentNode.extend(BlockNode);

BlockNode.static.isBlock = true;

module.exports = BlockNode;
