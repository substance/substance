'use strict';

var oo = require('../util/oo');
var DocumentNode = require('./DocumentNode');

function BlockNode() {
  BlockNode.super.apply(this, arguments);
}
oo.inherit(BlockNode, DocumentNode);

BlockNode.static.blockType = true;

module.exports = BlockNode;
