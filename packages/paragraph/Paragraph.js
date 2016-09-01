'use strict';

import TextBlock from '../../model/TextBlock'

function Paragraph() {
  Paragraph.super.apply(this, arguments);
}

TextBlock.extend(Paragraph);

Paragraph.type = "paragraph";

export default Paragraph;
