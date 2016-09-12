'use strict';

import TextBlock from '../../model/TextBlock'

function Codeblock() {
  Codeblock.super.apply(this, arguments);
}

TextBlock.extend(Codeblock);

Codeblock.type = "codeblock";

export default Codeblock;
