'use strict';

import TextNode from './TextNode'

function TextBlock() {
  TextNode.apply(this, arguments);
}

TextNode.extend(TextBlock);

TextBlock.isBlock = true;

export default TextBlock;
