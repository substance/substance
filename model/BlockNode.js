'use strict';

var oo = require('../util/oo');
var DocumentNode = require('./DocumentNode');

var BlockNode = function() {
  DocumentNode.apply(this, arguments);
}

BlockNode.Prototype = function() {
};

oo.inherit(BlockNode, TextNode);

BlockNode.static.blockType = true;

module.exports = BlockNode;
