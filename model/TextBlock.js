'use strict';

var oo = require('../util/oo');
var TextNode = require('./TextNode');

function TextBlock() {
  TextNode.apply(this, arguments);
}

oo.inherit(TextBlock, TextNode);

TextBlock.static.blockType = true;

module.exports = TextBlock;
