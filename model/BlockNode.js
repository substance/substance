'use strict';

var oo = require('../util/oo');
var DocumentNode = require('./DocumentNode');

function BlockNode() {
  DocumentNode.apply(this, arguments);
}

BlockNode.Prototype = function() {
};

oo.inherit(BlockNode, DocumentNode);

BlockNode.static.blockType = true;

module.exports = BlockNode;
