'use strict';

import TextBlock from '../../model/TextBlock'

function Blockquote() {
  Blockquote.super.apply(this, arguments);
}

TextBlock.extend(Blockquote);

Blockquote.type = "blockquote";

export default Blockquote;
