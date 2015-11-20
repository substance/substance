'use strict';

var TextNode = require('./TextNode');

function TextBlock() {
  TextNode.apply(this, arguments);
}

TextNode.extend(TextBlock);

TextBlock.static.isBlock = true;

module.exports = TextBlock;
